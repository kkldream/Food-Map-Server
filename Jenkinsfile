pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh '''build_name=jenkins/${PROJECT_NAME}:${BRANCH_NAME}-${BUILD_NUMBER}

docker build \\
  -t ${build_name} \\
  -f Dockerfile-slim \\
  .'''
      }
    }

    stage('Deploy') {
      parallel {
        stage('main') {
          when {
            branch 'main'
          }
          steps {
            withCredentials(bindings: [
                            string(credentialsId: 'kk-mongodb_url', variable: 'MONGODB_URL'),
                            string(credentialsId: 'food_map-root_access_key', variable: 'ROOT_ACCESS_KEY'),
                            string(credentialsId: 'food_map-google_api_key', variable: 'GOOGLE_API_KEY'),
                            string(credentialsId: 'food_map-fcm_access_key', variable: 'CREFCM_ACCESS_KEY')
                          ]) {
                sh '''run_name=jk-${PROJECT_NAME}-${BRANCH_NAME}
build_name=jenkins/${PROJECT_NAME}:${BRANCH_NAME}-${BUILD_NUMBER}

docker rm -f ${run_name}
docker run \\
  -d \\
  --restart=unless-stopped \\
  --name ${run_name} \\
  -p 53000:3000 \\
  -e NODE_ENV=production \\
  -e ROOT_ACCESS_KEY=${ROOT_ACCESS_KEY} \\
  -e MONGODB_URL=${MONGODB_URL} \\
  -e GOOGLE_API_KEY=${GOOGLE_API_KEY} \\
  -e FCM_ACCESS_KEY=${CREFCM_ACCESS_KEY} \\
  ${build_name}'''
              }

            }
          }

          }
        }

        stage('Test') {
          steps {
            sh 'echo Not test yet!'
          }
        }

      }
      environment {
        PROJECT_NAME = 'food_map'
      }
      post {
        success {
          library 'shared-library'
          discord_notifaction true
        }

        unsuccessful {
          library 'shared-library'
          discord_notifaction false
        }

      }
    }
