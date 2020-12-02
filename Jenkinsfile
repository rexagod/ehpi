pipeline {
  agent any
  options {
    timestamps()
  }
  stages {
    stage('Build') {
      steps {
        echo 'BUILD STAGE STARTED'
        nodejs(nodeJSInstallationName: 'Node10') {
            sh 'npm --version'
            sh 'npm i'
            sh 'npm run lint:fix'
        }
        echo 'BUILD STAGE COMPLETED'
      }
    }
    stage('Test') {
      steps {
        echo 'TEST STAGE STARTED'
        nodejs(nodeJSInstallationName: 'Node10') {
            sh 'npm run test' 
        }
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
        echo 'DEPLOY STAGE STARTED'
        nodejs(nodeJSInstallationName: 'Node10') {
            sh 'npm run svg'
            sh 'npm run md'
            sh 'npm run html'
        }
        echo 'DEPLOY STAGE COMPLETE'
      }
    }
  }
  post {
    success {
        echo 'PIPELINE SUCCESSFUL'
    }
    failure {
        echo 'PIPELINE FAILED'
    }
  }
}
