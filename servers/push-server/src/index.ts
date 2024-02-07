import {Worker, isMainThread} from 'worker_threads';
import Sentry from './sentry'
import { worker } from './worker'
import {numWorkers, msBetweenStarts} from './config'

if (isMainThread) {
  console.log('Starting main')
  const exitHandler = (code:number) => {
    startWorker()
  }
  const errorHandler = (error:number) => {
    throw error
  }
  const startWorker = () => {
    const worker = new Worker(__filename)
    worker.on('error', errorHandler)
    worker.on('exit', exitHandler)
  }

  for (let i = 0; i < numWorkers; i++) {
    setTimeout(() => startWorker(), msBetweenStarts)
  }

  // TODO: jesh 2019-09-18 - Prevent memory leak so that this is not required.
  // setTimeout(() => process.exit(), msRestart)
} else {
  console.log('Starting worker')
  worker.work()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error in job", err)
    Sentry.captureException(err)
    return Sentry.flush()
  })
  .finally(() => {
    console.log('Shutting down workers')
    process.exit(1)
  })
}
