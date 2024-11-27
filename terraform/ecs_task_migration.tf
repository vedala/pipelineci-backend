#
# ECS task for migrations
#

# resource "aws_ecs_cluster" "pipelineci_cluster" {
#   name = "pipelineci-fargate-cluster"
# }

# resource "aws_iam_policy" "ecs_execution_policy" {
#   name = "ecs_execution_policy"
#   description = "ECS Execution Policy"

#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Action = [
#           "ecs:ListTasks",
#           "ecs:DescribeTasks",
#           "ecs:StopTask",
#           "ecs:StartTask",
#           "ecs:RunTask",
#         ],
#         Effect   = "Allow",
#         Resource = "*",
#       },
#       {
#         Action = [
#           "ecr:GetAuthorizationToken",
#           "ecr:BatchCheckLayerAvailability",
#           "ecr:GetDownloadUrlForLayer",
#           "ecr:GetRepositoryPolicy",
#           "ecr:GetRepositoryPolicy",
#           "ecr:BatchGetImage",
#         ],
#         Effect   = "Allow",
#         Resource = "*",
#       },
#       {
#         Action = [
#           "logs:CreateLogGroup",
#           "logs:CreateLogStream",
#           "logs:PutLogEvents",
#         ],
#         Effect   = "Allow",
#         Resource = "*",
#       }
#     ]
#   })
# }

# resource "aws_iam_role_policy_attachment" "ecs_execution_attachment" {
#   policy_arn  = aws_iam_policy.ecs_execution_policy.arn
#   role        = aws_iam_role.ecs_execution_role.name
# }

resource "aws_cloudwatch_log_group" "pipelineci_migrations_log_group" {
  name              = "/ecs/pipelineci-backend-migrations"
  retention_in_days = 7
}

resource "aws_ecs_task_definition" "pipelineci_migrations_task_definition" {
  family                    = "pipelineci-migrations-task"
  network_mode              = "awsvpc"
  requires_compatibilities  = ["FARGATE"]
  execution_role_arn        = aws_iam_role.ecs_execution_role.arn
  cpu                       = "256"
  memory                    = "512"

  container_definitions = jsonencode([
    {
      name  = "pipelineci-migrations",
      image = "888577039580.dkr.ecr.us-west-2.amazonaws.com/pipelineci-backend:0.1",
      command = ["npm", "run", "migrate:prod"],
      portMappings = [
        {
          containerPort = 3000,
          hostPort      = 3000,
        },
      ],
      environment = [
        {
          "name": "AUTH0_AUDIENCE",
          "value": var.AUTH0_AUDIENCE
        },
        {
          "name": "AUTH0_ISSUER_BASE_URL",
          "value": var.AUTH0_ISSUER_BASE_URL
        },
        {
          "name": "NODE_ENV",
          "value": var.NODE_ENV
        },
        {
          "name": "ORGANIZATIONS_TABLE_NAME",
          "value": var.ORGANIZATIONS_TABLE_NAME
        },
        {
          "name": "GITHUB_APP_IDENTIFIER",
          "value": var.GITHUB_APP_IDENTIFIER
        },
        {
          "name": "GITHUB_APP_PRIVATE_KEY",
          "value": var.GITHUB_APP_PRIVATE_KEY
        },
        {
          "name": "DB_HOST",
          "value": aws_db_instance.pipelineci_db.address
        },
        {
          "name": "DB_USER",
          "value": aws_db_instance.pipelineci_db.username
        },
        {
          "name": "DB_PASSWORD",
          "value": var.DB_PASSWORD
        },
        {
          "name": "DB_NAME",
          "value": aws_db_instance.pipelineci_db.db_name
        },
        {
          "name": "DB_PORT",
          "value": tostring(aws_db_instance.pipelineci_db.port)
        },
        {
          "name": "RDS_CERT_BUNDLE",
          "value": var.RDS_CERT_BUNDLE
        }
      ],
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.pipelineci_migrations_log_group.name
          awslogs-region        = "us-west-2"
          awslogs-stream-prefix = "ecs"
        }
      }
    },
  ])
}
