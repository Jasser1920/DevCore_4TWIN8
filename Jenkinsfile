pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_HUB_USERNAME    = "${DOCKER_HUB_CREDENTIALS_USR}"
        IMAGE_TAG              = "${GIT_COMMIT[0..6]}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend - Install & Lint & Test') {
            steps {
                dir('smartsite-backend/smartsite-backend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm test -- --passWithNoTests'
                }
            }
        }

        stage('Frontend - Install & Lint & Test') {
            steps {
                dir('smartsite-frontend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm test'
                }
            }
        }

        stage('Build Images') {
            steps {
                sh 'docker build -t $DOCKER_HUB_USERNAME/smartsite-backend:$IMAGE_TAG smartsite-backend/smartsite-backend'
                sh 'docker build -t $DOCKER_HUB_USERNAME/smartsite-frontend:$IMAGE_TAG smartsite-frontend'
            }
        }

        stage('Push Images') {
            steps {
                sh 'echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_USERNAME --password-stdin'
                sh 'docker push $DOCKER_HUB_USERNAME/smartsite-backend:$IMAGE_TAG'
                sh 'docker push $DOCKER_HUB_USERNAME/smartsite-frontend:$IMAGE_TAG'
            }
        }

    }

    post {
        always {
            sh 'docker logout'
        }
        failure {
            echo 'Pipeline failed — check logs above'
        }
        success {
            echo "Images pushed: backend:${IMAGE_TAG} frontend:${IMAGE_TAG}"
        }
    }
}
