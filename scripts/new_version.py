#!/usr/bin/python3
"""Create new tagged version.

Script to update git submodules, pull out their version strings
and add them into the docker compose files.
After running the tests a new tag is created and all updates are commited.
"""

import sys
import subprocess
import re


BACKEND_VERSION_FILE_PATH = 'testcenter-backend/composer.json'
BACKEND_VERSION_REGEX = '(?<=version": ")(.*)(?=")'
FRONTEND_VERSION_FILE_PATH = 'testcenter-frontend/package.json'
FRONTEND_VERSION_REGEX = BACKEND_VERSION_REGEX
BS_VERSION_FILE_PATH = 'testcenter-broadcasting-service/package.json'
BS_VERSION_REGEX = BACKEND_VERSION_REGEX

COMPOSE_FILE_PATHS = [
    'docker-compose.prod.yml',
    'docker-compose.prod.tls.yml',
    'docker-compose.prod.tls.acme.yml']

backend_version = ''
frontend_version = ''
bs_version = ''


def check_prerequisites():
    """Check a couple of things to make sure one is ready to commit."""
    # on branch master?
    result = subprocess.run("git branch --show-current",
                            text=True, shell=True, check=True, capture_output=True)
    if result.stdout.rstrip() != 'master':
        sys.exit('ERROR: Not on master branch!')
    # pulled?
    result = subprocess.run("git fetch origin --dry-run",
                            text=True, shell=True, check=True, capture_output=True)
    if result.stderr.rstrip() != '':
        sys.exit('ERROR: Not up to date with remote branch!')


def update_submodules():
    subprocess.run('make update-submodules', shell=True, check=True)


def get_version_from_file(file_path, regex):
    pattern = re.compile(regex)
    with open(file_path, 'r') as f:
        match = pattern.search(f.read())
        if match:
            return match.group()
        else:
            sys.exit('Version pattern not found in file. Check your regex!')


def update_compose_file_versions(backend_version, frontend_version, bs_version):
    backend_pattern = re.compile('(?<=iqbberlin\\/testcenter-backend:)(.*)')
    frontend_pattern = re.compile('(?<=iqbberlin\\/testcenter-frontend:)(.*)')
    bs_pattern = re.compile('(?<=iqbberlin\\/testcenter-broadcasting-service:)(.*)')
    for conmpose_file in COMPOSE_FILE_PATHS:
        with open(conmpose_file, 'r') as f:
            file_content = f.read()
        new_file_content = backend_pattern.sub(backend_version, file_content)
        new_file_content = frontend_pattern.sub(frontend_version, new_file_content)
        new_file_content = bs_pattern.sub(bs_version, new_file_content)
        with open(conmpose_file, 'w') as f:
            f.write(new_file_content)


def run_tests():
    """Run end to end tests via make target."""
    subprocess.run('make test-e2e', shell=True, check=True)


def git_tag(backend_version, frontend_version, bs_version):
    """Add updated compose files and submodules hashes and commit them to repo."""
    new_version_string = f"{frontend_version}@{backend_version}+{bs_version}"
    print(f"Creating git tag for version {new_version_string}")
    subprocess.run("git add testcenter-backend", shell=True, check=True)
    subprocess.run("git add testcenter-frontend", shell=True, check=True)
    subprocess.run("git add testcenter-broadcasting-service", shell=True, check=True)
    for compose_file in COMPOSE_FILE_PATHS:
        subprocess.run(f"git add {compose_file}", shell=True, check=True)

    subprocess.run(f"git commit -m \"Update version to {new_version_string}\"", shell=True, check=True)
    subprocess.run("git push origin master", shell=True, check=True)

    subprocess.run(f"git tag {new_version_string}", shell=True, check=True)
    subprocess.run(f"git push origin {new_version_string}", shell=True, check=True)


check_prerequisites()
update_submodules()
backend_version = get_version_from_file(BACKEND_VERSION_FILE_PATH, BACKEND_VERSION_REGEX)
frontend_version = get_version_from_file(FRONTEND_VERSION_FILE_PATH, FRONTEND_VERSION_REGEX)
bs_version = get_version_from_file(BS_VERSION_FILE_PATH, BS_VERSION_REGEX)
update_compose_file_versions(backend_version, frontend_version, bs_version)
run_tests()
git_tag(backend_version, frontend_version, bs_version)
