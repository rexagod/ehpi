pipeline {
	agent any
	options {
		timestamps()
	}
	tools {
		nodejs 'Node10'
	}
	stages {
		stage('Build') {
			steps {
				echo 'BUILD STAGE STARTED'
				/usr/bin/npm 'run svg'
				echo 'BUILD STAGE COMPLETED'
			}
		}
		stage('Test') {
			steps {
				echo 'TEST STAGE STARTED'
				/usr/bin/npm 'run test' 
				echo 'TEST STAGE COMPLETE'
			}
		}
		stage('Deploy') {
			when {
				expression {
					currentBuild.result == null || currentBuild.result == 'SUCCESS'
				}
			}
			steps {
				// deploy artifacts to `gh-pages` branch
				echo 'DEPLOY STAGE STARTED'
				/usr/bin/npm 'run md'
				/usr/bin/npm 'run html'
				echo 'DEPLOY STAGE COMPLETE'
			}
		}
	}
	post {
		success {
				echo 'ALL STAGES WERE SUCCESSFUL'
		}
		failure {
				echo 'PIPELINE FAILED'
		}
	}
}
