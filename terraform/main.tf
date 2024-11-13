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
