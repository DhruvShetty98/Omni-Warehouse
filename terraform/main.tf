provider "docker" {}

# Create network per warehouse
resource "docker_network" "warehouse_net" {
  name = "warehouse_${var.name}_net"
}

# Volume for MySQL data
resource "docker_volume" "mysql_data" {
  name = "mysql_${var.name}_data"
}

# MySQL container
resource "docker_container" "mysql" {
  name  = "mysql_${var.name}"
  image = "mysql:latest"

  env = [
    "MYSQL_ROOT_PASSWORD=12345",
    "MYSQL_DATABASE=warehouse"
  ]

  networks_advanced {
    name = docker_network.warehouse_net.name
  }

  volumes {
    volume_name    = docker_volume.mysql_data.name
    container_path = "/var/lib/mysql"
  }

  # ❗ No external port → avoids conflict for multiple warehouses
}