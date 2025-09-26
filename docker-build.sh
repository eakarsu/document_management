#!/bin/bash

# Docker Build Script for Document Management System
# Supports both Mac (Apple Silicon & Intel) and Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Detect OS and Architecture
detect_platform() {
    OS=$(uname -s)
    ARCH=$(uname -m)

    if [ "$OS" = "Darwin" ]; then
        PLATFORM="Mac"
        if [ "$ARCH" = "arm64" ]; then
            DOCKER_PLATFORM="linux/arm64"
            PLATFORM_DESC="Mac Apple Silicon (M1/M2/M3)"
        else
            DOCKER_PLATFORM="linux/amd64"
            PLATFORM_DESC="Mac Intel"
        fi
    elif [ "$OS" = "Linux" ]; then
        PLATFORM="Linux"
        if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
            DOCKER_PLATFORM="linux/arm64"
            PLATFORM_DESC="Linux ARM64"
        else
            DOCKER_PLATFORM="linux/amd64"
            PLATFORM_DESC="Linux x86_64"
        fi
    else
        print_error "Unsupported OS: $OS"
        exit 1
    fi

    print_info "Detected Platform: $PLATFORM_DESC"
    print_info "Docker Platform: $DOCKER_PLATFORM"
}

# Check Docker installation
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        if [ "$PLATFORM" = "Mac" ]; then
            print_info "Visit: https://www.docker.com/products/docker-desktop/"
        else
            print_info "Install with: curl -fsSL https://get.docker.com | sh"
        fi
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        if [ "$PLATFORM" = "Mac" ]; then
            print_info "Start Docker Desktop from Applications"
        else
            print_info "Start with: sudo systemctl start docker"
        fi
        exit 1
    fi

    print_info "Docker version: $(docker --version)"
}

# Build options
BUILD_TYPE=${1:-"production"}
IMAGE_NAME="dms-app"
IMAGE_TAG=${2:-"latest"}

# Main build function
build_docker_image() {
    print_info "Starting Docker build process..."
    print_info "Build type: $BUILD_TYPE"
    print_info "Image: $IMAGE_NAME:$IMAGE_TAG"

    # Clean up old builds (optional)
    if [ "$3" = "--clean" ]; then
        print_warning "Cleaning up old images..."
        docker rmi $(docker images -q $IMAGE_NAME) 2>/dev/null || true
    fi

    # Platform-specific build
    if [ "$PLATFORM" = "Mac" ] && [ "$ARCH" = "arm64" ]; then
        print_info "Building for Apple Silicon with multi-platform support..."

        # Build for ARM64 (native)
        print_info "Building native ARM64 image..."
        docker build \
            --platform linux/arm64 \
            -t ${IMAGE_NAME}:${IMAGE_TAG}-arm64 \
            -f Dockerfile \
            --build-arg NODE_ENV=$BUILD_TYPE \
            .

        # Optionally build for AMD64 (for compatibility)
        if [ "$4" = "--multi-arch" ]; then
            print_info "Building AMD64 image for compatibility..."
            docker build \
                --platform linux/amd64 \
                -t ${IMAGE_NAME}:${IMAGE_TAG}-amd64 \
                -f Dockerfile \
                --build-arg NODE_ENV=$BUILD_TYPE \
                .

            # Create manifest for multi-arch support
            print_info "Creating multi-arch manifest..."
            docker manifest create ${IMAGE_NAME}:${IMAGE_TAG} \
                ${IMAGE_NAME}:${IMAGE_TAG}-arm64 \
                ${IMAGE_NAME}:${IMAGE_TAG}-amd64

            docker manifest push ${IMAGE_NAME}:${IMAGE_TAG}
        else
            # Tag ARM64 as latest for local use
            docker tag ${IMAGE_NAME}:${IMAGE_TAG}-arm64 ${IMAGE_NAME}:${IMAGE_TAG}
        fi

    elif [ "$PLATFORM" = "Mac" ] && [ "$ARCH" != "arm64" ]; then
        print_info "Building for Intel Mac..."
        docker build \
            --platform linux/amd64 \
            -t ${IMAGE_NAME}:${IMAGE_TAG} \
            -f Dockerfile \
            --build-arg NODE_ENV=$BUILD_TYPE \
            .

    else
        # Linux builds
        print_info "Building for Linux..."
        docker build \
            --platform $DOCKER_PLATFORM \
            -t ${IMAGE_NAME}:${IMAGE_TAG} \
            -f Dockerfile \
            --build-arg NODE_ENV=$BUILD_TYPE \
            .
    fi

    print_info "Build completed successfully!"
    print_info "Image size: $(docker images $IMAGE_NAME:$IMAGE_TAG --format 'table {{.Size}}')"
}

# Docker Compose build
build_with_compose() {
    print_info "Building with Docker Compose..."

    if [ "$PLATFORM" = "Mac" ] && [ "$ARCH" = "arm64" ]; then
        # Set platform for Apple Silicon
        export DOCKER_DEFAULT_PLATFORM=linux/arm64
    fi

    # Build all services
    docker-compose build --parallel

    print_info "Docker Compose build completed!"
}

# Run the built image
run_docker_image() {
    print_info "Running Docker container..."

    # Stop existing container if running
    docker stop dms-app 2>/dev/null || true
    docker rm dms-app 2>/dev/null || true

    # Run with platform-specific settings
    docker run -d \
        --name dms-app \
        --platform $DOCKER_PLATFORM \
        -p 3000:3000 \
        -p 4000:4000 \
        -v $(pwd)/uploads:/app/backend/uploads \
        -v $(pwd)/logs:/app/logs \
        --env-file .env \
        --restart unless-stopped \
        ${IMAGE_NAME}:${IMAGE_TAG}

    print_info "Container started successfully!"
    print_info "Frontend: http://localhost:3000"
    print_info "Backend API: http://localhost:4000"
    print_info "View logs: docker logs -f dms-app"
}

# Display usage
usage() {
    echo "Usage: $0 [build-type] [tag] [options]"
    echo ""
    echo "Build types:"
    echo "  production  - Production build (default)"
    echo "  development - Development build"
    echo ""
    echo "Options:"
    echo "  --clean       - Remove old images before building"
    echo "  --multi-arch  - Build for multiple architectures (Mac M1/M2/M3 only)"
    echo "  --compose     - Use Docker Compose to build all services"
    echo "  --run         - Run the container after building"
    echo ""
    echo "Examples:"
    echo "  $0 production latest          # Build production image"
    echo "  $0 development dev --run      # Build and run development"
    echo "  $0 production latest --clean  # Clean build"
    echo "  $0 production latest --compose # Build with Docker Compose"
    echo ""
    echo "Platform-specific examples:"
    echo "  Mac M1/M2/M3:"
    echo "    $0 production latest --multi-arch  # Build for ARM64 and AMD64"
    echo ""
    echo "  Linux:"
    echo "    $0 production latest --run         # Build and run"
}

# Main execution
main() {
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        usage
        exit 0
    fi

    print_info "==================================="
    print_info "Docker Build Script for DMS"
    print_info "==================================="

    # Detect platform
    detect_platform

    # Check Docker
    check_docker

    # Parse options
    if [[ " $@ " =~ " --compose " ]]; then
        build_with_compose
    else
        build_docker_image
    fi

    # Run if requested
    if [[ " $@ " =~ " --run " ]]; then
        run_docker_image
    fi

    print_info "==================================="
    print_info "Build process completed!"
    print_info "==================================="
}

# Run main function
main "$@"