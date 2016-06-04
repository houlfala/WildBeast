'use strict'
var Config = require('../../../config.json')
var Db = require('nedb')
var Logger = require('../../internal/logger.js').Logger
var database = new Db({
  filename: './runtime/databases/perms',
  autoload: true
})

exports.checkLevel = function (msg, user, roles) {
  return new Promise(function (resolve, reject) {
    if (Config.permissions.master.indexOf(user) > -1) {
      return resolve(9)
    } else if (Config.permissions.level1.indexOf(user) > -1) {
      return resolve(1)
    } else if (Config.permissions.level2.indexOf(user) > -1) {
      return resolve(2)
    } else if (Config.permissions.level3.indexOf(user) > -1) {
      return resolve(3)
    } else if (msg.isPrivate) {
      return resolve(0)
    }
    database.find({
      _id: msg.guild.id
    }, function (err, doc) {
      if (err) {
        return reject(err)
      } else if (doc) {
        if (doc.length <= 0) {
          initialize(msg.guild)
          return reject('No database!')
        }
        if (doc.length > 0 && !doc[0].perms.hasOwnProperty('negative') || doc[0].version !== 3.0) {
          var version
          doc[0].version !== undefined ? version = doc[0].version : version = 1.0
          insertNewStuff(msg.guild, version).catch((e) => Logger.error(e))
        } else {
          if (doc[0].superUser === user) {
            return resolve(4)
          }
          var level = 0
          for (var r of roles) {
            if (doc[0].perms.roles.level1.indexOf(r.id) > -1) {
              level = 1
            } else if (doc[0].perms.roles.level2.indexOf(r.id) > -1) {
              level = 2
            } else if (doc[0].perms.roles.level3.indexOf(r.id) > -1) {
              level = 3
            } else if (doc[0].perms.roles.negative.indexOf(r.id) > -1) {
              level = -1
            }
          }
          if (doc[0].perms.level1.indexOf(user) > -1) {
            level = (level > 1) ? level : 1
          } else if (doc[0].perms.level2.indexOf(user) > -1) {
            level = (level > 2) ? level : 2
          } else if (doc[0].perms.level3.indexOf(user) > -1) {
            level = (level > 3) ? level : 3
          } else if (doc[0].perms.hasOwnProperty('negative') && doc[0].perms.negative.indexOf(user) > -1) {
            level = -1
          }
          return resolve(level)
        }
      }
    })
  })
}

exports.adjustLevel = function (msg, users, level, roles) {
  return new Promise(function (resolve, reject) {
    database.find({
      _id: msg.guild.id
    }, function (err, docs) {
      if (err) {
        reject(err)
      } else if (docs) {
        if (docs.length <= 0) {
          initialize(msg.guild)
          return reject('No database!')
        }
        if (docs.length > 0 && !docs[0].perms.hasOwnProperty('negative') || docs[0].version !== 3.0) {
          var version
          docs[0].version !== undefined ? version = docs[0].version : version = 1.0
          insertNewStuff(msg.guild, version).catch((e) => Logger.error(e))
        } else {
          users.map((u) => {
            if (docs[0].perms.level1.indexOf(u.id) > -1 || docs[0].perms.level2.indexOf(u.id) > -1 || docs[0].perms.level3.indexOf(u.id) > -1 || docs[0].perms.negative.indexOf(u.id) > -1) {
              database.update({
                _id: msg.guild.id
              }, {
                $pull: {
                  'perms.level1': u.id,
                  'perms.level2': u.id,
                  'perms.level3': u.id,
                  'perms.negative': u.id
                }
              })
            }
            if (level === 0) {
              return resolve(0)
            } else if (level === 1) {
              database.update({
                _id: msg.guild.id
              }, {
                $push: {
                  'perms.level1': u.id
                }
              }, {}, function (err) {
                if (err) {
                  return reject(err)
                } else {
                  return resolve(1)
                }
              })
            } else if (level === 2) {
              database.update({
                _id: msg.guild.id
              }, {
                $push: {
                  'perms.level2': u.id
                }
              }, {}, function (err) {
                if (err) {
                  return reject(err)
                } else {
                  return resolve(2)
                }
              })
            } else if (level === 3) {
              database.update({
                _id: msg.guild.id
              }, {
                $push: {
                  'perms.level3': u.id
                }
              }, {}, function (err) {
                if (err) {
                  return reject(err)
                } else {
                  return resolve(3)
                }
              })
            } else if (level < 0) {
              database.update({
                _id: msg.guild.id
              }, {
                $push: {
                  'perms.negative': u.id
                }
              }, {}, function (err) {
                if (err) {
                  return reject(err)
                } else {
                  return resolve(-1)
                }
              })
            } else {
              return reject('Not supported!')
            }
          })
          roles.map((r) => {
            if (docs[0].perms.roles.level1.indexOf(r.id) > -1 || docs[0].perms.roles.level2.indexOf(r.id) > -1 || docs[0].perms.roles.level3.indexOf(r.id) > -1 || docs[0].perms.roles.negative.indexOf(r.id) > -1) {
              database.update({
                _id: msg.guild.id
              }, {
                $pull: {
                  'perms.roles.level1': r.id,
                  'perms.roles.level2': r.id,
                  'perms.roles.level3': r.id,
                  'perms.roles.negative': r.id
                }
              })
            }
            if (level === 0) {
              return resolve(0)
            } else if (level === 1) {
              database.update({
                _id: msg.guild.id
              }, {
                $push: {
                  'perms.roles.level1': r.id
                }
              }, {}, function (err) {
                if (err) {
                  return reject(err)
                } else {
                  return resolve(1)
                }
              })
            } else if (level === 2) {
              database.update({
                _id: msg.guild.id
              }, {
                $push: {
                  'perms.roles.level2': r.id
                }
              }, {}, function (err) {
                if (err) {
                  return reject(err)
                } else {
                  return resolve(2)
                }
              })
            } else if (level === 3) {
              database.update({
                _id: msg.guild.id
              }, {
                $push: {
                  'perms.roles.level3': r.id
                }
              }, {}, function (err) {
                if (err) {
                  return reject(err)
                } else {
                  return resolve(3)
                }
              })
            } else if (level < 0) {
              database.update({
                _id: msg.guild.id
              }, {
                $push: {
                  'perms.roles.negative': r.id
                }
              }, {}, function (err) {
                if (err) {
                  return reject(err)
                } else {
                  return resolve(-1)
                }
              })
            } else {
              return reject('Not supported!')
            }
          })
        }
      }
    })
  })
}

exports.checkNSFW = function (msg) {
  return new Promise(function (resolve, reject) {
    database.find({
      _id: msg.guild.id
    }, function (err, docs) {
      if (err) {
        return reject(err)
      } else if (docs) {
        if (docs.length <= 0) {
          initialize(msg.guild)
          return reject('No database!')
        }
        if (docs.length > 0 && !docs[0].perms.hasOwnProperty('negative') || docs[0].version !== 3.0) {
          var version
          docs[0].version !== undefined ? version = docs[0].version : version = 1.0
          insertNewStuff(msg.guild, version).catch((e) => Logger.error(e))
        } else {
          if (docs[0].perms.nsfw.indexOf(msg.channel.id) > -1) {
            return resolve(true)
          } else {
            return resolve(false)
          }
        }
      }
    })
  })
}

exports.adjustNSFW = function (msg, what) {
  return new Promise(function (resolve, reject) {
    database.find({
      _id: msg.guild.id
    }, function (err, docs) {
      if (err) {
        reject(err)
      } else if (docs) {
        if (docs.length <= 0) {
          initialize(msg.guild)
          return reject('No database!')
        }
        if (docs.length > 0 && !docs[0].perms.hasOwnProperty('negative') || docs[0].version !== 3.0) {
          var version
          docs[0].version !== undefined ? version = docs[0].version : version = 1.0
          insertNewStuff(msg.guild, version).catch((e) => Logger.error(e))
        } else {
          if (what === 'on') {
            database.update({
              _id: msg.guild.id
            }, {
              $push: {
                'perms.nsfw': msg.channel.id
              }
            }, {}, function (err) {
              if (err) {
                return reject(err)
              } else {
                return resolve(1)
              }
            })
          } else if (what === 'off') {
            database.update({
              _id: msg.guild.id
            }, {
              $pull: {
                'perms.nsfw': msg.channel.id
              }
            }, {}, function (err) {
              if (err) {
                return reject(err)
              } else {
                return resolve(0)
              }
            })
          } else {
            return reject('Not supported!')
          }
        }
      }
    })
  })
}

exports.isKnown = function (guild) {
  return new Promise(function (resolve, reject) {
    database.find({
      _id: guild.id
    }, function (err, docs) {
      if (err) {
        reject(err)
      } else if (docs) {
        if (docs.length <= 0) {
          initialize(guild).then((r) => {
            resolve(r)
          }).catch((e) => {
            reject(e)
          })
        } else {
          resolve()
        }
      }
    })
  })
}

function insertNewStuff (guild, version) {
  /*eslint indent: 0*/
  return new Promise(function (resolve, reject) {
    switch (version) {
      case 1.0:
        database.update({
          _id: guild.id
        }, {
          $set: {
            'perms.negative': ['NaN'],
            version: 2.0
          }
        }, function (err, res) {
          if (err) {
            return reject(err)
          } else if (res) {
            return resolve(res)
          }
        })
        break
      case 2.0:
        database.update({
          _id: guild.id
        }, {
          $set: {
            'perms.roles.level1': ['NaN'],
            'perms.roles.level2': ['NaN'],
            'perms.roles.level3': ['NaN'],
            'perms.roles.negative': ['NaN'],
            version: 3.0
          }
        }, function (err, res) {
          if (err) {
            return reject(err)
          } else if (res) {
            return resolve(res)
          }
        })
        break
      default:
        return reject('Unknown database version.')
    }
  })
}

exports.databaseEval = function (v) {
  return new Promise(function (resolve, reject) {
    try {
      resolve(eval(v))
    } catch (e) {
      reject(e)
    }
  })
}

exports.restore = function (guild) {
  return new Promise(function (resolve, reject) {
    database.find({
      _id: guild.id
    }, function (err, docs) {
      if (err) {
        reject(err)
      } else if (docs) {
        if (docs.length > 0) {
          database.remove({
            _id: guild.id
          }, function (err) {
            if (err) {
              return reject(err)
            }
          })
        }
      }
      initialize(guild).then(() => {
        return resolve('Done!')
      }).catch((e) => {
        return reject(e)
      })
    })
  })
}

function initialize (guild) {
  return new Promise(function (resolve, reject) {
    var doc = {
      _id: guild.id,
      version: 3.0,
      superUser: guild.owner.id,
      blacklisted: false,
      perms: {
        level1: ['NaN'],
        level2: ['NaN'],
        level3: ['NaN'],
        negative: ['NaN'],
        nsfw: ['NaN'],
        roles: {
          level1: ['NaN'],
          level2: ['NaN'],
          level3: ['NaN'],
          negative: ['NaN']
        }
      }
    }
    database.insert(doc, function (err, doc) {
      if (err) {
        reject(err)
      } else if (doc) {
        resolve(doc)
      }
    })
  })
}
