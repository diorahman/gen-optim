class Ok {
  async say (ok) {
    return await this.hello(ok)
  }

  async hello (ok) {
    return ok
  }
}

module.exports = Ok
