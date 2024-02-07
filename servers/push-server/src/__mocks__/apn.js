'use strict'

const apn = jest.genMockFromModule('apn')

class Provider {
  async send(note, tokenString) {
    return {
      failed: []
    };
  }
  shutdown () {}
}

apn.Provider = Provider

module.exports = apn

