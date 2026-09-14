pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    environment {
        FEEDBACK_FILE = 'feedback.txt'
        TEST_REPORT = 'frontend/test-results.xml'
        GIT_CREDENTIALS = 'github-event-planner-git'
        REPO_URL = 'https://github.com/Sudhakar-smi/DEVOPS-2026-CS-E-05.git'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Feedback Commit') {
            steps {
                script {
                    def changedFiles = bat(
                        script: '@git diff-tree --no-commit-id --name-only -r HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Files changed in latest commit:"
                    echo changedFiles

                    def files = changedFiles
                        .split('\\r?\\n')
                        .collect { it.trim() }
                        .findAll { it }

                    if (files.size() == 1 && files[0] == 'feedback.txt') {
                        env.SKIP_FEEDBACK_PIPELINE = 'true'
                        echo 'Jenkins feedback commit detected.'
                        echo 'Skipping tests and feedback push to prevent webhook loop.'
                    } else {
                        env.SKIP_FEEDBACK_PIPELINE = 'false'
                        echo 'Normal developer commit detected.'
                    }
                }
            }
        }

        stage('Install Dependencies') {
            when {
                expression {
                    env.SKIP_FEEDBACK_PIPELINE != 'true'
                }
            }

            steps {
                dir('frontend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Run Tests') {
            when {
                expression {
                    env.SKIP_FEEDBACK_PIPELINE != 'true'
                }
            }

            steps {
                dir('frontend') {
                    script {
                        def testExitCode = bat(
                            returnStatus: true,
                            script: 'npm test -- --reporter=verbose --reporter=junit --outputFile=test-results.xml'
                        )

                        env.TEST_EXIT_CODE = testExitCode.toString()

                        if (testExitCode == 0) {
                            echo 'All tests passed.'
                        } else {
                            echo "Tests completed with exit code: ${testExitCode}"
                            echo 'Feedback will still be generated.'
                        }
                    }
                }
            }
        }

        stage('Build') {
            when {
                expression {
                    env.SKIP_FEEDBACK_PIPELINE != 'true'
                }
            }

            steps {
                dir('frontend') {
                    bat 'npm run build'
                }
            }
        }

        stage('Generate Feedback') {
            when {
                expression {
                    env.SKIP_FEEDBACK_PIPELINE != 'true'
                }
            }

            steps {
                powershell '''
                    if (-not (Test-Path "frontend/test-results.xml")) {
                        throw "JUnit test report was not generated."
                    }

                    [xml]$report = Get-Content "frontend/test-results.xml"

                    $total = [int]$report.testsuites.tests
                    $failed = [int]$report.testsuites.failures
                    $errors = [int]$report.testsuites.errors
                    $skipped = [int]$report.testsuites.skipped

                    $passed = $total - $failed - $errors - $skipped

                    if (($failed + $errors) -eq 0) {
                        $status = "PASS"
                    }
                    else {
                        $status = "FAIL"
                    }

                    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

                    $testRows = ""

                    foreach ($suite in $report.testsuites.testsuite) {

                        foreach ($test in $suite.testcase) {

                            $testName = [string]$test.name

                            if ([string]::IsNullOrWhiteSpace($testName)) {
                                $testName = "Unnamed Test"
                            }

                            $testStatus = "PASS"

                            if ($null -ne $test.failure -or $null -ne $test.error) {
                                $testStatus = "FAIL"
                            }
                            elseif ($null -ne $test.skipped) {
                                $testStatus = "SKIPPED"
                            }

                            $testRows += "$testName : $testStatus`r`n"
                        }
                    }

                    $newFeedback = @"
========================================
AI Event Planner - Jenkins Test Feedback
========================================

Build Number : $env:BUILD_NUMBER
Job Name     : $env:JOB_NAME
Branch       : $env:BRANCH_NAME
Commit       : $env:GIT_COMMIT
Date         : $timestamp

TEST SUMMARY
----------------------------------------
Total Tests  : $total
Passed       : $passed
Failed       : $failed
Skipped      : $skipped
Errors       : $errors
Overall      : $status

TEST CASE RESULTS
----------------------------------------
$testRows
========================================

"@

                    Add-Content `
                        -Path "feedback.txt" `
                        -Value $newFeedback `
                        -Encoding utf8

                    Write-Host ""
                    Write-Host "========================================"
                    Write-Host "       TEST FEEDBACK SUMMARY"
                    Write-Host "========================================"
                    Write-Host "Total   : $total"
                    Write-Host "Passed  : $passed"
                    Write-Host "Failed  : $failed"
                    Write-Host "Skipped : $skipped"
                    Write-Host "Errors  : $errors"
                    Write-Host "Status  : $status"
                    Write-Host "========================================"
                '''
            }
        }

        stage('Push Feedback to Main') {
            when {
                allOf {
                    expression {
                        env.SKIP_FEEDBACK_PIPELINE != 'true'
                    }
                    branch 'main'
                }
            }

            steps {
                withCredentials([
                    gitUsernamePassword(
                        credentialsId: 'github-event-planner-git',
                        gitToolName: 'Default'
                    )
                ]) {

                    bat '''
                        git config user.name "Jenkins"
                        git config user.email "jenkins@event-planner.local"

                        git add feedback.txt

                        git diff --cached --quiet

                        if %ERRORLEVEL% EQU 0 (
                            echo No feedback changes to commit.
                        ) else (
                            git commit -m "Update Jenkins test feedback"
                            git push origin HEAD:main
                        )
                    '''
                }
            }
        }
    }

    post {

        always {
            junit(
                testResults: 'frontend/test-results.xml',
                allowEmptyResults: true
            )

            archiveArtifacts(
                artifacts: 'feedback.txt',
                fingerprint: true,
                allowEmptyArchive: true
            )

            echo "Build completed with status: ${currentBuild.currentResult}"
        }

        success {
            echo 'Jenkins pipeline completed successfully.'
        }

        failure {
            echo 'Jenkins pipeline failed.'
        }
    }
}