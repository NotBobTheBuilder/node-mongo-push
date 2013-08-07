var expr = require('express'),
    app = expr(),
    congo = require('congo'),
    io = require('socket.io').listen(app.listen(3000)),
    bodyParser = expr.bodyParser(),
    resources = ['users', 'messages'];

congo.configure({
  host: 'localhost',
  name: 'nodeMongoPush',
  collections: resources
});

function hasResource(req, res, next) {
  var resource = req.params.resource;
  if (resources.indexOf(resource) === -1) {
    res.send(400, {
      statusCode: 400,
      message: "That is not an available API resource"
    });
  } else {
    next();
  }
}

function validId(req, res, next) {
  var id = req.params.id;
  if (/^[0-9a-f]+$/.test(id) && id.length === 24) {
    next();
  } else {
    res.send(400, {
      statusCode: 400,
      message: "ID should be a 24-digit hex value"
    });
  }
}

congo.get(function (err, db) {
  app.get('/', function (req, res) {
    res.sendfile('./index.html');
  });

  app.get('/api', function (req, res) {
    res.send('hi');
  });

  app.get('/api/:resource', hasResource, function (req, res) {
    var resource = req.params.resource;
    db[resource].findAll({}, function (err, collection) {
      res.type('json').send({
        meta: {
          size: collection.length,
          result: resource
        },
        data: collection
      });
    });
  });

  app.get('/api/:resource/:id', hasResource, validId, function (req, res) {
  var resource = req.params.resource,
      id = congo.ObjectID(req.params.id);
    db[resource].findOne({_id: id}, function (err, result) {
      var count = Number(null !== result);
      res.type('json').send([404, 200][count], {
        meta: {
          size: count,
          result: resource
        },
        data: (result || {})
      });
    });
  });

  app.post('/api/:resource', hasResource, bodyParser, function (req, res) {
    var resource = req.params.resource;
    db[resource].insert(req.body, function (err, doc) {
      io.sockets.emit('new'+resource, doc[0]);
      res.location('/api/'+resource+'/'+doc['_id']).send(201, doc);
    });
  });
});
