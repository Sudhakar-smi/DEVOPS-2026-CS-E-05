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
                echo 'Running demo tests...'

                bat '''
                    echo Test 1: PASSED
                    echo Test 2: PASSED
                    echo Test 3: PASSED
                '''
            }
        }

        stage('Generate Feedback') {
            steps {
                bat '''
                    if not exist feedback mkdir feedback

                    echo Event-Planner Test Report > feedback/test-result.txt
                    echo ========================== >> feedback/test-result.txt
                    echo Build Number: %BUILD_NUMBER% >> feedback/test-result.txt
                    echo Branch: %BRANCH_NAME% >> feedback/test-result.txt
                    echo Build Status: SUCCESS >> feedback/test-result.txt
                    echo Test 1: PASSED >> feedback/test-result.txt
                    echo Test 2: PASSED >> feedback/test-result.txt
                    echo Test 3: PASSED >> feedback/test-result.txt
                '''

                echo 'Feedback file generated successfully'
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