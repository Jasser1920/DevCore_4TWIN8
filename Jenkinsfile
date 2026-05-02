pipeline {
    agent any
    
    environment {
        GHCR_REGISTRY = 'ghcr.io'
        GHCR_REPO = 'jasser1920'
        BACKEND_IMAGE = "${GHCR_REGISTRY}/${GHCR_REPO}/smartsite-backend"
        FRONTEND_IMAGE = "${GHCR_REGISTRY}/${GHCR_REPO}/smartsite-frontend"
        IMAGE_TAG = "${env.GIT_COMMIT.take(7)}"
        GHCR_CREDENTIALS = credentials('ghcr-credentials')
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code from ${env.GIT_BRANCH}"
                checkout scm
            }
        }
        
        stage('Build Backend Image') {
            steps {
                dir('smartsite-backend/smartsite-backend') {
                    script {
                        echo "Building backend image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
                        sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                    }
                }
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                dir('smartsite-frontend') {
                    script {
                        echo "Building frontend image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                        sh """
                            docker build \
                                --build-arg VITE_API_URL=http://localhost:3000 \
                                --build-arg VITE_RECAPTCHA_SITE_KEY=6LexbHosAAAAAA-0o_m20RsayxJE-9Zs8r2OWGZ_ \
                                -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                                -t ${FRONTEND_IMAGE}:latest \
                                .
                        """
                    }
                }
            }
        }
        
        stage('Push Images to GHCR') {
            steps {
                script {
                    echo "Logging into GitHub Container Registry"
                    sh "echo \$GHCR_CREDENTIALS_PSW | docker login ${GHCR_REGISTRY} -u \$GHCR_CREDENTIALS_USR --password-stdin"
                    
                    echo "Pushing backend images"
                    sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${BACKEND_IMAGE}:latest"
                    
                    echo "Pushing frontend images"
                    sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${FRONTEND_IMAGE}:latest"
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Pipeline completed successfully!"
            echo "Backend image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
            echo "Frontend image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo "❌ Pipeline failed. Check logs above."
        }
        always {
            sh "docker logout ${GHCR_REGISTRY}"
        }
    }
}
