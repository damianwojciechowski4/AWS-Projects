import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
from botocore.exceptions import ClientError
import sys
from datetime import datetime, date, time, timezone, timedelta
import dateutil.tz
import os

#################
### Variables ###
#################
dynamoDB_tableName = os.environ['dynamoDB_tableName']

# EC2
# Initialize EC2 Client
ec2_client = boto3.client('ec2')

# DynamoDB    
# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
schedule_table = dynamodb.Table(dynamoDB_tableName)

#weekdays map
weekday_map = {
"mon": 0,
"tue": 1,
"wed": 2,
"thu": 3,
"fri": 4,
"sat": 5,
"sun": 6
}



def lambda_handler(event, context):
    json_region = os.environ['AWS_REGION']
    print('## AWS REGION')
    print(json_region)
    print("## EVENT")
    print(event)
    print('#'*20)
    print()
    ec2Check()
    print('#'*20)
    

    
def ec2Check():
    
    #datetime current Time
    now = dateutil.tz.gettz('Europe/Berlin')
    current_time = datetime.now(now).time()

    #check weekday name 
    weekday_num = date.today().weekday()

    #request ec2 instances
    try: 
        response_ec2 = ec2_client.describe_instances()
        instances = response_ec2['Reservations']
        process_ec2_instances(instances, weekday_num, current_time)
    except ClientError as e:
        print(e.response['Error']['Message'])
        return

def ec2_start_instance(instance_id):
    try:
        response_ec2_start = ec2_client.start_instances(InstanceIds=[instance_id])
        print(f"- starting EC2 instance {instance_id}")
        #print(response_ec2_start)
    except ClientError as e:
        print(e.response['Error']['Message'])

def ec2_stop_instance(instance_id):
    try:
        response_ec2_stop = ec2_client.stop_instances(InstanceIds=[instance_id])
        #print(response_ec2_stop)
    except ClientError as e:
        print(e.response['Error']['Message'])



def process_ec2_instances(instances, weekday_num, current_time):
    instanceCount = 0
    for reservations in instances:
        instanceCount += 1
        for instance in reservations['Instances']:
            print(f"Instance #{instanceCount}")
            instance_id = instance['InstanceId']
            instance_state = instance['State']['Name']
            tags = instance['Tags']
            print(f"# Instance ID: {instance_id}")
            print(f"# Instance State: {instance_state}")
            print(40*"*")
            


            #if instance has terminated status skip it
            if (instance_state == 'terminated'):
                continue
            else:
                ec2_schedule_tag = ''
                #verify if EC2 instance has tag named Scheduler
                for tag in tags:
                    if tag['Key'] == 'Scheduler':
                        #assign Scheduler tag value to variable
                        schedule_tag = tag['Value']
                        ec2_schedule_tag = schedule_tag
                        break
                    else:
                        continue

                #Verify if Scheduler tag is empty
                if not ec2_schedule_tag:
                    print(f"Instance {instance_id} has no Scheduler tag configured, skipping this instance") 
                    break
                #if Scheduler tag is not empty
                else:
                    try:
                        response_dynamodb = schedule_table.scan(FilterExpression=Attr('schedulerName').eq(ec2_schedule_tag))
                        dynamo_items = response_dynamodb['Items']
                    except ClientError as e:
                        print(e.response['Error']['Message'])
                    if not dynamo_items:
                        print(f"DynamoDB {dynamoDB_tableName} does not contain schedule tag named {ec2_schedule_tag}")
                    #Check DynamoDB content based on filter expression
                for item in dynamo_items:
                    #compare weekday range and validate with current day
                    weekday_db_range = item['weekdays']
                    first_day, last_day = weekday_db_range.split('-')
                    first_day_num = weekday_map[first_day.lower()]
                    last_day_num = weekday_map[last_day.lower()]

                    if first_day_num <= weekday_num <= last_day_num:
                        if (item['schedulerName'] == ec2_schedule_tag):
                            
                            start_time = item['start_time']
                            start_time = datetime.strptime(start_time, "%H:%M:%S").time()

                            stop_time = item['stop_time']
                            stop_time = datetime.strptime(stop_time, "%H:%M:%S").time()
                            
                            print("------ Scheduler information -------")
                            print(f"- weekday is within specified range {weekday_db_range}")
                            print(f"--> start time {start_time}")
                            print(f"--> stop time {stop_time}")
                            print(f"--> current time {current_time}")

                            #Compare current time with start_time and stop_time
                            if current_time >= start_time and current_time <= stop_time:
                                #power on EC2 instance if state is stopped
                                if(instance_state == 'stopped'):
                                    ec2_start_instance(instance_id)
                                #if EC2 instance is running and we are in schedule window, do nothing
                                elif(instance_state == 'running'):
                                    print(f"Instance is currently in {instance_state} state, it's OK")
                                    continue
                                #if EC2 instance is in some intermediary state and we are in schedule window, do nothing
                                else:
                                    print(f"Instance {instance_id} is currently in {instance_state} state, it's OK")
                                    continue
                            # if current_time is behind schedule stop the instance
                            else:
                                #Check if instance is in running mode
                                if(instance_state == 'running'):
                                    ec2_stop_instance(instance_id)
                                    print(f"Stopping EC2 instance {instance_id}")
                                else:
                                    print(f"Instance {instance_id} is currently in {instance_state} state, it's expected")
                        else:
                            print("- scheduling tag and ownerID does NOT match!")
                    else:
                        print(f"- weekday is NOT in specified range {weekday_db_range}")
                        if(instance_state == 'running'):
                            ec2_stop_instance(instance_id)
                            print(f"Stopping EC2 instance {instance_id}, which is not intentend to be in {instance_state} state.")
                        else:
                            print(f"Instance {instance_id} is currently in {instance_state} state, it's expected")
