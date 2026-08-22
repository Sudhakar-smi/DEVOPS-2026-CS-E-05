pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Event-Planner build started'
            }
        }

        stage('Test') {
            steps {
                echo 'Event-Planner test completed'
            }
        }
    }

    post {
        success {
            echo 'BUILD SUCCESSFUL'
        }

        failure {
            echo 'BUILD FAILED'
        }
    }
}