## IP addressing Design Considerations

### **Best Practices**

`Small deployment:    /24 (256 IPs) - 251 usable
 Medium deployment:   /20 (4,096 IPs) - good for most use cases
 Large deployment:    /16 (65,536 IPs) - maximum VPC size
 Enterprise:          Multiple VPCs with /16 each`

**AWS Reserved IPs Per Subnet:**
AWS reserves 5 IPs in every subnet:

- `.0` - Network address
- `.1` - VPC router
- `.2` - DNS server
- `.3` - Reserved for future use
- `.255` - Broadcast (not used but reserved)

---

### Scale

**Growth Considerations:**

- Can add secondary CIDR blocks to VPC later (up to 5 total)
- Cannot modify existing CIDR blocks
- Plan for 3-5 years of growth
- Consider: dev, staging, prod environments
- Factor in: autoscaling, containers, ENIs per instance

---

### Overlapping

**How to Avoid Overlaps:**

**Strategy 1: Central IP Address Management (IPAM)**

- Use AWS IPAM or maintain a spreadsheet

**Fixing Overlaps (Migration Strategies):**

- Create new VPC with non-overlapping CIDR
- Migrate workloads gradually
- Use NAT or proxy for temporary communication
- AWS cannot change VPC CIDR to fix overlaps

### IPv6

- Optional but increasingly important
- AWS provides /56 IPv6 CIDR block (free)
- All IPv6 addresses are public (internet routable)
- Can enable IPv6 on existing VPCs

### Structure

**Hierarchical Design:**

**Traditional 3-Tier:**

```markup
VPC: 10.0.0.0/16

Presentation Tier (Public):
  - 10.0.0.0/24  (AZ-A)
  - 10.0.1.0/24  (AZ-B)
  - Web servers, load balancers

Application Tier (Private):
  - 10.0.10.0/24 (AZ-A)
  - 10.0.11.0/24 (AZ-B)
  - App servers, APIs

Database Tier (Private):
  - 10.0.20.0/24 (AZ-A)
  - 10.0.21.0/24 (AZ-B)
  - RDS, ElastiCache
```

**Modern Microservices:**

```markup
VPC: 10.0.0.0/16

Public Subnets (Load Balancers):
  - 10.0.0.0/24 (AZ-A)
  - 10.0.1.0/24 (AZ-B)

Private Subnets (ECS/EKS):
  - 10.0.16.0/20 (AZ-A) - Large for containers
  - 10.0.32.0/20 (AZ-B)

Data Subnets:
  - 10.0.48.0/24 (AZ-A)
  - 10.0.49.0/24 (AZ-B)
```

### **Naming Convention**

Use descriptive names that map to CIDR:

`vpc-prod-us-east-1-10-0-0-0-16
 subnet-pub-az-a-10-0-0-0-24
 subnet-pri-app-az-a-10-0-10-0-24
 subnet-pri-db-az-a-10-0-20-0-24`

**Multi-VPC Structures:**

**By Environment:**

```markup
VPC-Prod:    172.16.0.0/16
VPC-Staging: 172.17.0.0/16
VPC-Dev:     172.18.0.0/16
```

**By Business Unit:**

```markup
VPC-Finance:    172.16.0.0/16
VPC-HR:         172.17.0.0/16
VPC-Engineering: 172.18.0.0/16
```

**By Application:**

```markup
VPC-WebApp:     172.16.0.0/16
VPC-MobileAPI:  172.17.0.0/16
VPC-Analytics:  172.18.0.0/16
```

**Transit Gateway Hub-Spoke:**

```markup
Central Hub VPC:    10.0.0.0/16 (shared services)
Spoke VPCs:         10.1-255.0.0/16 (workloads)
On-Premises:        192.168.0.0/16
```


# Route Tables in VPC

## AWS Limits

- **Route tables per VPC**: 200 (soft limit, can be increased)
- **Routes per route table**: 50 for non-propagated routes; 1,000 if propagated via Transit Gateway
- One subnet = one route table (one route table can server many subnets)



### 1. **Public vs Private Subnets** (Most Common)

**Problem**: Web servers need internet access via IGW; app servers need outbound-only via NAT Gateway.

```markup
Public Subnet (10.0.1.0/24)
├── Route Table: public-rt
│   ├── 10.0.0.0/16 → local
│   └── 0.0.0.0/0 → igw-abc123 ← Direct internet

Private Subnet (10.0.11.0/24)
├── Route Table: private-rt
│   ├── 10.0.0.0/16 → local
│   └── 0.0.0.0/0 → nat-xyz789 ← Outbound-only via NAT
```

**Interview answer**: "Public subnets route `0.0.0.0/0` to an Internet Gateway for bidirectional internet. Private subnets route through a NAT Gateway for outbound-only, protecting backend resources."

### 2. **Database Tier Isolation** (Security Best Practice)

**Problem**: Databases don't need internet; giving them a NAT route violates least privilege and costs money.

```markup
Private DB Subnet (10.0.21.0/24)
├── Route Table: db-rt
│   └── 10.0.0.0/16 → local ← Only VPC-local routes
```

**Benefits**:

- **Security**: Zero internet exposure (even outbound)
- **Cost**: No NAT Gateway charges for DB traffic
- **Compliance**: PCI-DSS, HIPAA require network isolation

### 3. Hybrid Connectivity (VPN or Direct Connect)

Some subnets need to communicate with on-prem DC; other should stay cloud-only.

```markup
Branch Office Subnet (10.0.31.0/24)
├── Route Table: hybrid-rt
│   ├── 10.0.0.0/16 → local
│   ├── 192.168.0.0/16 → tgw-123 ← On-prem via Transit Gateway
│   └── 0.0.0.0/0 → nat-xyz789

Isolated Workload Subnet (10.0.41.0/24)
├── Route Table: isolated-rt
│   └── 10.0.0.0/16 → local ← No on-prem access
```

**Use case**: DevOps tools need to reach on-prem Git server; test environments should never touch production on-prem.

### 4. Traffic Inspection / Firewall Insertion

**Problem**: Security team requires all egress traffic inspected by AWS Network Firewall or third-party appliance.

```markup
Inspected Subnet (10.0.51.0/24)
├── Route Table: inspected-rt
│   ├── 10.0.0.0/16 → local
│   └── 0.0.0.0/0 → vpce-firewall ← Routes through Network Firewall endpoint

Un-inspected Subnet (10.0.61.0/24)
├── Route Table: direct-rt
│   ├── 10.0.0.0/16 → local
│   └── 0.0.0.0/0 → nat-xyz789 ← Direct to NAT (no inspection)
```

**Advanced pattern**: Gateway Load Balancer (GWLB) or Network Firewall endpoint as next-hop.

**Interview answer**: "We route production egress traffic through AWS Network Firewall for deep packet inspection. Development subnets bypass inspection to reduce costs."

### 5. Multi Account/ Multi-VPC Routing (Transit Gateway)

**Problem**: Different apps need different connectivity to shared services or other VPCs.

```markup
App A Subnet (10.0.71.0/24)
├── Route Table: app-a-rt
│   ├── 10.0.0.0/16 → local
│   ├── 10.1.0.0/16 → tgw-attach ← Can reach Shared Services VPC
│   └── 0.0.0.0/0 → nat-xyz789

App B Subnet (10.0.81.0/24)
├── Route Table: app-b-rt
│   ├── 10.0.0.0/16 → local
│   ├── 10.1.0.0/16 → tgw-attach ← Shared Services
│   ├── 10.2.0.0/16 → tgw-attach ← Can ALSO reach Partner VPC
│   └── 0.0.0.0/0 → nat-xyz789
```

**Use case**: App A is multi-tenant SaaS (no partner access); App B is B2B integration (needs partner VPC).
