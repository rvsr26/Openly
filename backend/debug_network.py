import socket
import os
import sys
from urllib.parse import urlparse

# Try to load dotenv, but fallback if missing
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Reading os.environ directly.")

LOG_FILE = "network_diag_log.txt"

def log(msg):
    print(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def check_port(host, port, service_name):
    log(f"Testing connectivity to {service_name} ({host}:{port})...")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            log(f"✅ TCP Connection to {service_name} SUCCESSFUL")
            return True
        else:
            log(f"❌ TCP Connection to {service_name} FAILED (Error Code: {result})")
            return False
    except Exception as e:
        log(f"❌ Error checking {service_name}: {e}")
        return False

def main():
    # Clear log
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("--- Network Diagnostic Log ---\n")

    # 1. MongoDB
    mongo_url = os.getenv("MONGODB_URL")
    if mongo_url:
        try:
            log(f"MongoDB URL found: {mongo_url[:20]}...")
            host = None
            if "@" in mongo_url:
                host_part = mongo_url.split("@")[1].split("/")[0]
            else:
                host_part = mongo_url.split("//")[1].split("/")[0]
            
            if "?" in host_part:
                host_part = host_part.split("?")[0]
            
            host = host_part
            log(f"Derived base host: {host}")
            
            # DNS resolution
            try:
                ip_list = socket.gethostbyname_ex(host)
                log(f"DNS Resolution: {ip_list}")
            except Exception as e:
                log(f"⚠️ Basic DNS Resolution failed: {e}")

            # SRV Lookup
            try:
                import dns.resolver
                log("Attempting SRV lookup...")
                srv_records = dns.resolver.resolve('_mongodb._tcp.' + host, 'SRV')
                for srv in srv_records:
                    target = str(srv.target).rstrip('.')
                    log(f"Found SRV Record: {target}:{srv.port}")
                    check_port(target, srv.port, "MongoDB Shard")
                    break # Checking one is enough
            except ImportError:
                log("⚠️ dnspython not installed. Skipping SRV lookup.")
                # Fallback: try connecting to port 27017 on the base host (likely to fail for SRV)
                check_port(host, 27017, "MongoDB (Direct)")
            except Exception as e:
                log(f"⚠️ SRV lookup failed: {e}")

        except Exception as e:
            log(f"Error processing MongoDB URL: {e}")
    else:
        log("❌ MONGODB_URL not set")

    # 2. Redis
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            log(f"Redis URL found: {redis_url[:20]}...")
            if "redis://" in redis_url:
                # redis://user:pass@host:port
                after_proto = redis_url.split("redis://")[1]
                if "@" in after_proto:
                    host_port = after_proto.split("@")[1]
                else:
                    host_port = after_proto
                
                if ":" in host_port:
                    host = host_port.split(":")[0]
                    port = int(host_port.split(":")[1].split("/")[0])
                else:
                    host = host_port.split("/")[0]
                    port = 6379
                
                check_port(host, port, "Redis")
            else:
                log("Redis URL format not recognized")
        except Exception as e:
            log(f"Error processing Redis URL: {e}")
    else:
        log("❌ REDIS_URL not set")

if __name__ == "__main__":
    main()
