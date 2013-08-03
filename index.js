var app = require('express')(),
    congo = require('congo'),
    io = require('socket.io').listen(app.listen(3000)),
    resources = ['users', 'messages'];

congo.configure({
  host: 'localhost',
  name: 'nodeMongoPush',
  collections: resources
});

function hasResource(req, res, next) {
  var resource = req.params.resource;
  if (resources.indexOf(resource) === -1) {
    res.status(404).send('Don\'t have '+resource+' in '+JSON.stringify(resources));
    next('routes');
  } else {
    next();
  }
}

app.get('/', function (req, res) {
  res.sendfile('./index.html');
});

app.get('/api', function (req, res) {
  res.send('hi');
});

app.get('/api/:resource', hasResource, function (req, res) {
  var resource = req.params.resource;
  congo.get(function (err, db) {
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
});

app.get('/api/:resource/:id', hasResource, function (req, res) {
  var resource = req.params.resource,
      id = req.params.id;
  congo.get(function (err, db) {
    db[resource].findOne({id: id}, function (err, result) {
      var count = Number(null !== result);
      res.status([
        404, 200
      ][count]).type('json').send({
        meta: {
          size: count,
          result: resource
        },
        data: (result || {})
      });
    });
  });
});
