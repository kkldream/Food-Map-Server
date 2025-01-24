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
            sh '''run_name=jk-${PROJECT_NAME}-${BRANCH_NAME}
build_name=jenkins/${PROJECT_NAME}:${BRANCH_NAME}-${BUILD_NUMBER}

docker rm -f ${run_name}
docker run \\
  -d \\
  --restart=unless-stopped \\
  --name ${run_name} \\
  -p 53000:3000 \\
  -e NODE_ENV=production \\
  -e ROOT_ACCESS_KEY=mmslab \\
  -e MONGODB_URL=mongodb://root:czctwhgu12332162@kkserver.net:52701/ \\
  -e GOOGLE_API_KEY=AIzaSyBplwzpm2yi4sn_RhqOu2gyCNTZEjDQfFs \\
  -e FCM_ACCESS_KEY=AAAABZTBGIc:APA91bGLjiBTSL8SLTRF-Pcbeh5Ne_XfomNTS11IZpkF-ptOpUJYDPxk8BRmkSicp-dYR9Is5Bsk5jYcOsST2ylUQnQR-sI9y8tpmxIAuLnhH1K85gY8cC8zSsimgvGVMOigCuTSYiqE \\
  ${build_name}'''
          }
        }

        stage('dev') {
          when {
            branch 'dev'
          }
          steps {
            sh '''run_name=jk-${PROJECT_NAME}-${BRANCH_NAME}
build_name=jenkins/${PROJECT_NAME}:${BRANCH_NAME}-${BUILD_NUMBER}

docker rm -f ${run_name}
docker run \\
  -d \\
  --restart=always \\
  --name ${run_name} \\
  -p 54000:3000 \\
  -e NODE_ENV=development \\
  -e ROOT_ACCESS_KEY=mmslab \\
  -e MONGODB_URL=mongodb://root:czctwhgu12332162@kkserver.net:52701/ \\
  -e GOOGLE_API_KEY=AIzaSyBplwzpm2yi4sn_RhqOu2gyCNTZEjDQfFs \\
  -e FCM_ACCESS_KEY=AAAABZTBGIc:APA91bGLjiBTSL8SLTRF-Pcbeh5Ne_XfomNTS11IZpkF-ptOpUJYDPxk8BRmkSicp-dYR9Is5Bsk5jYcOsST2ylUQnQR-sI9y8tpmxIAuLnhH1K85gY8cC8zSsimgvGVMOigCuTSYiqE \\
  ${build_name}'''
          }
        }

      }
    }

    stage('Test') {
      steps {
        withCredentials([
          string(credentialsId: 'kk_mongodb_url', variable: 'MONGODB_URL'),
          string(credentialsId: 'food_map-google_api_key', variable: 'GOOGLE_API_KEY'),
          string(credentialsId: 'food_map-fcm_access_key', variable: 'CREFCM_ACCESS_KEYD2')
        ]) {
          echo "MONGODB_URL: ${MONGODB_URL}"
          echo "GOOGLE_API_KEY: ${GOOGLE_API_KEY}"
          echo "CREFCM_ACCESS_KEYD2: ${CREFCM_ACCESS_KEYD2}"
        }
      }
    }

  }
  environment {
    PROJECT_NAME = 'food_map'
  }
  post {
    always {
      library 'shared-library'
      discord_notifaction(true)
    }

    failure {
      library 'shared-library'
      discord_notifaction(false)
    }

  }
}