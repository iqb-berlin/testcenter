# Change base compose file for 'www-fix'
wget -nv -O docker-compose.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/docker/docker-compose.yml

# Change compose file for non-tls setup
wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/docker-compose.prod.yml

# Download additional compose file
wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/docker-compose.prod.tls.yml

# Change Makefile for non-tls setup
wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/Makefile
