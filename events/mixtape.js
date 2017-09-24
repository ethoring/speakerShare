const _ = require('underscore');
const Promise = require('bluebird');
const mongoose = require('mongoose');

const Mix = mongoose.models.Mix;

module.exports = (rt, socket) => {
  /**
   * doesMixExist checks our database to see if the mix object
   * exists.
   * @param  {[type]} name [description]
   * @return {[type]}      [description]
   */
  const doesMixExist = (name) => {
    return new Promise((resolve, reject) => {
      Mix.find({ "name": name })
        .then((response) => {
          console.log(`Does ${name} exist? ` + !_.isEmpty(response));
          return resolve(!_.isEmpty(response));
        });
    });
  }

  /**
   * isMixChannelEmpty checks a mix to see if there are users inside.
   * @param  {[type]}  name The name of the mix we're looking up.
   * @return {Boolean}      Are there users in this mix?
   */
  const isMixChannelEmpty = (name) => {
    return new Promise((resolve, reject) => {
      rt.of('/').in(name).clients((error, users) => {
        if (error) return reject(error);
        console.log(`Is ${name} empty? ` + _.isEmpty(users));
        return resolve(_.isEmpty(users));
      });
    });
  }

  /**
   * mixResponse formats a response object so we don't send back
   * hidden info about a mix, like the pass or the admin id.
   * @param  {object} mix initial Mix object
   * @return {object}     clean response Mix object
   */
  const mixResponse = (mix) => {
    return {
      "name": mix.name,
      "description": mix.description,
      "created": mix.created
    }
  }

  /**
 * [updateUserList description]
 * @param  {[type]}   mixName  name of the mix
 * @return {[type]}            [description]
 */
  const updateUserList = (mixName, newUser) => {
    return new Promise((resolve, reject) => {
<<<<<<< HEAD
      console.log(`updating user list for ${mixName} `)

      Mix.findOne({ "name": mixName })
        .then((mix) => {
          console.log('pushign users');
          mix.users.push(newUser);
          return mix;
        })
        .then((mix) => {
          console.log('mix saved');
          mix.save();
          return mix;
        })
        .then((mix) => {
          console.log('populating')
          console.log(mix);
          
          mix.populate('users')
            .execPopulate()
            .then((populatedMix) => {
              console.log(populatedMix);
              rt.emit('update user list', populatedMix);
              return populatedMix;
            })
        })
        .catch((err) => {
          console.log(`error in updating mix user list for ${ mixName }`);
          console.log(err);
          return reject(err);
        });
=======
      console.log(`updating user list for ${ mixName } `)
      Mix.findOne({ "name": mixName }).
        populate('users').
        exec(function (err, mix) {
          if (err) {
            console.log(`error updating user list for ${ mixName } `);
          }
          console.log(`mix: ${ mix }`);
          // rt.emit('update user list', mix.users);
      });
>>>>>>> 3ee63efb227ea00e7a80b9ede5a1373f85b6c90a
    });
  }

  /**
   * Creates a new mix with given name and pass.
   * @param  {[type]}   data     [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  const createMix = (data, callback) => {
    let mix = new Mix();

    console.log(data);
    let mixName = data.name.toLowerCase();
    let mixPass = data.pass;

    Promise.all([
      doesMixExist(mixName),
      isMixChannelEmpty(mixName)
    ])
      .then((res) => {
        console.log("Should we go ahead and create this mix? " + _.isEqual(res, [false, true]));
        if (_.isEqual(res, [false, true])) {
          mix.set({
            "name": mixName,
            "pass": mixPass,
            "description": data.description,
            "admin": data.mongo_id,
            "users": [data.mongo_id]
          })
            .save()
            .then((res) => {
              console.log(res);
              console.log(`Success, new mix '${mixName}' created.`);
              socket.join(mixName);
              return callback({
                status: true,
                mix: mixResponse(res)
              });
            });
        } else {
          console.log("Failure, mix not created. " + mixName);
          return callback({
            status: false
          });
        }
      });
  }

  /**
   * [joinMix description]
   * @param  {[type]}   data     [description]
   * @param  {Function} callback [description]
   * @return {Boolean}           Is join successful?
   */
  const joinMix = (data, callback) => {
    let mixName = data.name.toLowerCase();
    let mixPass = data.pass;

    console.log("fuckin join mix: " + data);
    console.log(data);

    Mix.findOne({ "name": mixName })
      .then((res) => {
        console.log(res);
        console.log(_.isObject(res));
        console.log(mixName === res.name);
        console.log(mixPass == res.pass);
        if (_.isObject(res)
          && mixName === res.name
          && mixPass == res.pass) {
          socket.join(mixName).then(updateUserList(mixName, data.mongo_id));
          return callback({
            status: true,
            mix: mixResponse(res)
          });
        }
        else {
          return callback({
            status: false
          });
        }
      });
  }

  const leaveMix = (data, callback) => {
    console.log("Leaving Mix " + data);
    data = data.toLowerCase();
    // remove user's socket id from mixUsers list on db.mix.(data)
    socket.leave(data, (response) => {
      console.log(response);
      return callback({
        "status": true,
        "response": response
      });
    });
  }

  /**
   * On the 'View data Users' event, the currently connected user
   * can check the users also participating in their mix.
   */


  return { createMix, joinMix, leaveMix };
}
