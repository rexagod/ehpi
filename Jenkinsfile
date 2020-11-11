pipeline {
	agent any
	
	git url: 'https://github.com/rexagod/ehpi.git'
	def node = tool 'Node10'
	env.PATH = "${node}/bin/npm:${env.PATH}"
	stages {
		stage('Build') {
			steps {
				echo 'BUILD STAGE STARTED'
				npm run svg
				echo 'BUILD STAGE COMPLETED'
			}
		}
		stage('Test') {
			steps {
				echo 'TEST STAGE STARTED'
				npm run test 
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
				npm run md
				npm run html
				echo 'DEPLOY STAGE COMPLETE'
			}
		}
	}
}
