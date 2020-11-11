pipeline {
	agent any
	options {
		timestamps()
	}
	tools {
		node 'Node10'
	}
	environment {
		PATH = "${node}/bin:${PATH}"
	}
	stages {
		stage('Build') {
			steps {
				echo 'BUILD STAGE STARTED'
				npm 'run svg'
				echo 'BUILD STAGE COMPLETED'
			}
		}
		stage('Test') {
			steps {
				echo 'TEST STAGE STARTED'
				npm 'run test' 
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
				npm 'run md'
				npm 'run html'
				echo 'DEPLOY STAGE COMPLETE'
			}
		}
	}
	post {
		echo 'FINISHED'
	}
}
