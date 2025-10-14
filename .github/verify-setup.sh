#!/bin/bash

###############################################################################
# GitHub Actions Setup Verification Script
# 
# This script verifies that your GitHub Actions workflows are properly
# configured and ready to run.
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}GitHub Actions Setup Verification${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}✗ Not in a git repository${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git repository detected${NC}"

# Check if .github/workflows directory exists
if [ ! -d ".github/workflows" ]; then
    echo -e "${RED}✗ .github/workflows directory not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .github/workflows directory exists${NC}"

# Check for workflow files
WORKFLOWS_FOUND=0

if [ -f ".github/workflows/ci.yml" ]; then
    echo -e "${GREEN}✓ CI workflow found (ci.yml)${NC}"
    WORKFLOWS_FOUND=$((WORKFLOWS_FOUND + 1))
else
    echo -e "${YELLOW}⚠ CI workflow not found (ci.yml)${NC}"
fi

if [ -f ".github/workflows/e2e-tests.yml" ]; then
    echo -e "${GREEN}✓ E2E workflow found (e2e-tests.yml)${NC}"
    WORKFLOWS_FOUND=$((WORKFLOWS_FOUND + 1))
else
    echo -e "${YELLOW}⚠ E2E workflow not found (e2e-tests.yml)${NC}"
fi

if [ $WORKFLOWS_FOUND -eq 0 ]; then
    echo -e "${RED}✗ No workflows found${NC}"
    exit 1
fi

# Check for required project files
echo ""
echo -e "${BLUE}Checking project dependencies...${NC}"

if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json found${NC}"
else
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi

if [ -f "yarn.lock" ]; then
    echo -e "${GREEN}✓ yarn.lock found${NC}"
else
    echo -e "${YELLOW}⚠ yarn.lock not found (will be generated on first install)${NC}"
fi

# Check for e2e directory and run script
if [ -d "e2e" ]; then
    echo -e "${GREEN}✓ e2e directory found${NC}"
    
    if [ -f "e2e/run" ]; then
        echo -e "${GREEN}✓ e2e/run script found${NC}"
        
        if [ -x "e2e/run" ]; then
            echo -e "${GREEN}✓ e2e/run script is executable${NC}"
        else
            echo -e "${YELLOW}⚠ e2e/run script is not executable${NC}"
            echo -e "  ${YELLOW}Run: chmod +x e2e/run${NC}"
        fi
    else
        echo -e "${RED}✗ e2e/run script not found${NC}"
    fi
else
    echo -e "${RED}✗ e2e directory not found${NC}"
fi

# Check for requirements scripts
if [ -f "requirements" ]; then
    echo -e "${GREEN}✓ requirements script found${NC}"
    if [ ! -x "requirements" ]; then
        echo -e "${YELLOW}⚠ requirements script is not executable (chmod +x requirements)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ requirements script not found${NC}"
fi

if [ -f "requirements-test" ]; then
    echo -e "${GREEN}✓ requirements-test script found${NC}"
    if [ ! -x "requirements-test" ]; then
        echo -e "${YELLOW}⚠ requirements-test script is not executable (chmod +x requirements-test)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ requirements-test script not found${NC}"
fi

# Check Node.js version
echo ""
echo -e "${BLUE}Checking local environment...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: ${NODE_VERSION}${NC}"
    
    # Check if version is 16.x or higher
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -ge 16 ]; then
        echo -e "${GREEN}✓ Node.js version is compatible (>=16)${NC}"
    else
        echo -e "${YELLOW}⚠ Node.js version might be too old (need >=16)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Node.js not found in PATH${NC}"
fi

if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    echo -e "${GREEN}✓ Yarn installed: ${YARN_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ Yarn not found in PATH${NC}"
fi

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker installed: ${DOCKER_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ Docker not found (needed for E2E tests)${NC}"
fi

# Check GitHub remote
echo ""
echo -e "${BLUE}Checking GitHub configuration...${NC}"

REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
    echo -e "${GREEN}✓ Git remote configured: ${REMOTE_URL}${NC}"
    
    # Extract repo info
    if [[ $REMOTE_URL =~ github\.com[:/](.+)\.git ]]; then
        REPO_PATH="${BASH_REMATCH[1]}"
        echo -e "${GREEN}✓ GitHub repository: ${REPO_PATH}${NC}"
        
        # Check if public or private
        echo -e "${BLUE}→ Badge URL: https://github.com/${REPO_PATH}/workflows/CI/badge.svg${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No git remote configured${NC}"
fi

# Check if there are uncommitted workflow changes
echo ""
echo -e "${BLUE}Checking workflow status...${NC}"

if git ls-files .github/workflows/*.yml > /dev/null 2>&1; then
    TRACKED_WORKFLOWS=$(git ls-files .github/workflows/*.yml | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ ${TRACKED_WORKFLOWS} workflow(s) tracked by git${NC}"
else
    echo -e "${YELLOW}⚠ Workflows not yet committed to git${NC}"
    echo -e "  ${YELLOW}Run: git add .github/ && git commit -m 'Add GitHub Actions workflows'${NC}"
fi

# Validate YAML syntax (if yq or python is available)
echo ""
echo -e "${BLUE}Validating workflow syntax...${NC}"

YAML_VALID=true

for workflow in .github/workflows/*.yml; do
    if [ -f "$workflow" ]; then
        # Try to validate with different tools
        if command -v yamllint &> /dev/null; then
            if yamllint -d relaxed "$workflow" &> /dev/null; then
                echo -e "${GREEN}✓ $(basename $workflow) - Valid YAML${NC}"
            else
                echo -e "${RED}✗ $(basename $workflow) - Invalid YAML${NC}"
                YAML_VALID=false
            fi
        elif command -v python3 &> /dev/null; then
            if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" &> /dev/null; then
                echo -e "${GREEN}✓ $(basename $workflow) - Valid YAML${NC}"
            else
                echo -e "${RED}✗ $(basename $workflow) - Invalid YAML${NC}"
                YAML_VALID=false
            fi
        else
            echo -e "${YELLOW}⚠ $(basename $workflow) - Cannot validate (install yamllint or python3)${NC}"
        fi
    fi
done

# Summary
echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}======================================${NC}"

if [ $WORKFLOWS_FOUND -gt 0 ] && [ "$YAML_VALID" = true ]; then
    echo -e "${GREEN}✓ Setup looks good!${NC}\n"
    
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Commit and push workflows to GitHub:"
    echo "   git add .github/"
    echo "   git commit -m 'Add GitHub Actions workflows'"
    echo "   git push"
    echo ""
    echo "2. Go to your repository on GitHub"
    echo "   → Actions tab"
    echo ""
    echo "3. Manually trigger E2E workflow:"
    echo "   → E2E Tests - Nightly"
    echo "   → Run workflow"
    echo ""
    echo "4. Create a Pull Request to test CI workflow"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "   .github/workflows/README.md - Setup guide"
    echo "   .github/GITHUB_ACTIONS_MIGRATION.md - Migration guide"
    echo "   .github/STATUS_BADGES.md - Badge examples"
    
    exit 0
else
    echo -e "${RED}✗ Setup has issues that need to be resolved${NC}\n"
    
    echo -e "${YELLOW}Please fix the issues above and run this script again.${NC}"
    exit 1
fi

