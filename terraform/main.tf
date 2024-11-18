terraform {
  required_version = ">= 1.0.0, < 2.0.0"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"
  profile =  "kv97usr1"
}

#
# VPC
#

resource "aws_vpc" "pipelineci_vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "pipelineci_public_subnet_01" {
  vpc_id            = aws_vpc.pipelineci_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "pipelineci_public_subnet_01"
  }
}

resource "aws_subnet"  "pipelineci_public_subnet_02" {
  vpc_id            = aws_vpc.pipelineci_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2b"

  tags = {
    Name = "pipelineci_public_subnet_02"
  }
}

resource "aws_subnet"  "pipelineci_private_subnet_01" {
  vpc_id            = aws_vpc.pipelineci_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "pipelineci_private_subnet_01"
  }
}

resource "aws_subnet"  "pipelineci_private_subnet_02" {
  vpc_id            = aws_vpc.pipelineci_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-west-2b"

  tags = {
    Name = "pipelineci_private_subnet_02"
  }
}

resource "aws_internet_gateway" "pipelineci_igw" {
  vpc_id = aws_vpc.pipelineci_vpc.id
}

resource "aws_route_table" "pipelineci_public_rt" {
  vpc_id = aws_vpc.pipelineci_vpc.id
}

resource "aws_route_table" "pipelineci_private_rt" {
  vpc_id = aws_vpc.pipelineci_vpc.id
}

resource "aws_route" "pipelineci_public_route" {
  route_table_id          = aws_route_table.pipelineci_public_rt.id
  destination_cidr_block  = "0.0.0.0/0"
  gateway_id              = aws_internet_gateway.pipelineci_igw.id
}

resource "aws_route_table_association" "pipelineci_subnet_association_pub01" {
  subnet_id       = aws_subnet.pipelineci_public_subnet_01.id
  route_table_id  = aws_route_table.pipelineci_public_rt.id
}

resource "aws_route_table_association" "pipelineci_subnet_association_pub02" {
  subnet_id       = aws_subnet.pipelineci_public_subnet_02.id
  route_table_id  = aws_route_table.pipelineci_public_rt.id
}

resource "aws_route_table_association" "pipelineci_subnet_association_priv01" {
  subnet_id       = aws_subnet.pipelineci_private_subnet_01.id
  route_table_id  = aws_route_table.pipelineci_private_rt.id
}

resource "aws_route_table_association" "pipelineci_subnet_association_priv02" {
  subnet_id       = aws_subnet.pipelineci_private_subnet_02.id
  route_table_id  = aws_route_table.pipelineci_private_rt.id
}

resource "aws_eip" "pipelineci_vpc_eip" {
  instance = null
}

resource "aws_nat_gateway" "pipelineci_vpc_nat_gw" {
  allocation_id = aws_eip.pipelineci_vpc_eip.id
  subnet_id     = aws_subnet.pipelineci_public_subnet_01.id
}

resource "aws_route" "pipelineci_private_subnet_route" {
  route_table_id          = aws_route_table.pipelineci_private_rt.id
  destination_cidr_block  = "0.0.0.0/0"
  nat_gateway_id          = aws_nat_gateway.pipelineci_vpc_nat_gw.id
}

#
# Load Balancer
#

resource "aws_lb" "pipelineci_alb" {
  name                = "pipelineci-alb"
  internal            = false
  load_balancer_type  = "application"
  subnets             = [aws_subnet.pipelineci_public_subnet_01.id, aws_subnet.pipelineci_public_subnet_02.id]
  security_groups     = [aws_security_group.pipelineci_lb_sg.id]
}

resource "aws_lb_target_group" "pipelineci_target_group" {
  name        = "pipelineci-target-group"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.pipelineci_vpc.id
  target_type = "ip"

  health_check {
    path                = "/health"
    port                = 3000
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    matcher             = "200-499"
  }
}

resource "aws_lb_listener" "pipelineci_lb_listener" {
  load_balancer_arn = aws_lb.pipelineci_alb.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = data.aws_acm_certificate.pipelineci_certificate.arn

  default_action {
    type              = "forward"
    target_group_arn  = aws_lb_target_group.pipelineci_target_group.arn
  }
}

resource "aws_lb_listener_rule" "pipelineci_lb_listener_rule" {
  listener_arn = aws_lb_listener.pipelineci_lb_listener.arn
  priority     = 100

  action {
    type              = "forward"
    target_group_arn  = aws_lb_target_group.pipelineci_target_group.arn
  }

  condition {
    path_pattern {
      values = ["*"]
    }
  }
}

resource "aws_security_group" "pipelineci_lb_sg" {
  name        = "pipelineci-lb-sg"
  description = "Security group for alb"

  vpc_id = aws_vpc.pipelineci_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"  # Allow all outbound traffic
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_acm_certificate" "pipelineci_certificate" {
  domain      = "${var.SUBDOMAIN}.${var.DOMAIN_NAME}"
  statuses    = ["ISSUED"]
  most_recent = true
}

resource "aws_lb_listener_certificate" "pipelineci_alb_certificate" {
  listener_arn    = aws_lb_listener.pipelineci_lb_listener.arn
  certificate_arn = data.aws_acm_certificate.pipelineci_certificate.arn
}


output "pipelineci_alb" {
  value = aws_lb.pipelineci_alb.dns_name
  description = "Load balancer dns_name to add to CNAME for subdomain delegation"
}

#
# Database
#

resource "aws_db_instance" "pipelineci_db" {
  allocated_storage    = 20
  db_name              = "pipelinci_db"
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t3.micro"
  username             = "ciadmin"
  password             = "vEgGeCRW9wrSY768"
  publicly_accessible  = false
  skip_final_snapshot  = true

  db_subnet_group_name = aws_db_subnet_group.pipelineci_postgres_subnet_group.name

  tags = {
    Name = "PipelineciPostgresDb"
  }
}

resource "aws_db_subnet_group" "pipelineci_postgres_subnet_group" {
  name       = "pipelineci-pg-subnet-group"
  subnet_ids = [
    aws_subnet.pipelineci_private_subnet_01.id,
    aws_subnet.pipelineci_private_subnet_02.id
  ]

  tags = {
    Name = "PipelineciPostgresSubnetGroup"
  }
}
