const smpp = require('smpp');
const A = require('async');
const debug = require('debug')('engine:smpp');

class SmppEngine {
  constructor(script, ee, helpers) {
    this.script = script;
    this.ee = ee;
    this.helpers = helpers;

    this.target = script.config.target;
    this.port = script.config.smpp.port;
    this.system_id = script.config.smpp.system_id;
    this.password = script.config.smpp.password;

    return this;
  }

  createScenario(scenarioSpec, ee) {
    const self = this;
    const tasks = scenarioSpec.flow.map((rs) => this.step(rs, ee));

    return function scenario(initialContext, done) {
      ee.emit('started');
      const session = new smpp.Session({
        host: self.target,
        port: self.port,
      });

      const context = {
        session,
        connected: false,
        bound: false,
        ...initialContext,
      };

      session.once('connect', () => {
        context.connected = true;
        debug('SMPP session connected');
      });

      session.on('close', () => {
        debug('SMPP session closed');
        context.connected = false;
      });

      session.on('error', (err) => {
        debug('SMPP error:', err);
      });

      A.waterfall(
        [
          function connect(callback) {
            const interval = setInterval(() => {
              if (context.connected) {
                clearInterval(interval);
                callback(null, context);
              }
            }, 10);
          },
          ...tasks,
          function closeSession(ctx, cb) {
            ctx.session.close();
            cb(null, ctx);
          },
        ],
        function finished(err, context) {
          if (err) debug('Scenario error:', err);
          return done(err, context);
        }
      );
    };
  }

  step(rs, ee) {
    const self = this;

    if (rs.think) {
      return self.helpers.createThink(rs, self.script.config.defaults || {});
    }

    if (rs.bindTransceiver) {
      return function bindTransceiver(context, callback) {
        const start = Date.now();

        context.session.bind_transceiver(
          {
            system_id: self.system_id,
            password: self.password,
          },
          function (pdu) {
            const latency = Date.now() - start;

            if (pdu.command_status === 0) {
              context.bound = true;
              ee.emit('counter', 'smpp.bind_success', 1);
              ee.emit('histogram', 'smpp.bind_latency', latency);
            } else {
              ee.emit('counter', 'smpp.bind_fail', 1);
              debug('Bind failed:', pdu.command_status);
            }

            return callback(null, context);
          }
        );
      };
    }

    if (rs.enquireLink) {
      return function enquireLink(context, callback) {
        const start = Date.now();

        context.session.enquire_link((pdu) => {
          const latency = Date.now() - start;

          if (pdu.command_status === 0) {
            ee.emit('counter', 'smpp.enquire_success', 1);
            ee.emit('histogram', 'smpp.enquire_latency', latency);
          } else {
            ee.emit('counter', 'smpp.enquire_fail', 1);
            debug('Enquire failed:', pdu.command_status);
          }

          return callback(null, context);
        });
      };
    }

    return function noop(context, callback) {
      return callback(null, context);
    };
  }
}

module.exports = SmppEngine;
