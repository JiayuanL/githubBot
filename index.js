var fs = require('fs');
var http = require('http');
var https = require('https');
var Git = require("nodegit");
var path = require("path");
var privateKey  = fs.readFileSync('sslcert/selfsigned.key', 'utf8');
var certificate = fs.readFileSync('sslcert/selfsigned.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var bodyParser = require("body-parser")
var app = express();

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);

app.use(bodyParser.urlencoded({
    extended:true
}));
  
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/app.js", function(req, res) {
    res.sendFile(__dirname + "/public/app.js");
  });
  
var repoDir = "C:/FHL2021Fall/VBProject1/Modules";

app.get("/commit/", function(req, res) { 
    var fileName = "Module1.vb";

    console.log('github API is called, files are commited');
    Git.Repository.open(path.resolve(__dirname, repoDir))
    .then(function(repoResult) {
        repo = repoResult;
        return commitFile(repo, fileName, "updated file: " + fileName);
    })
   
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/push/", function(req, res) { 
    console.log('github API is called, Push');
    Git.Repository.open(path.resolve(__dirname, repoDir))
    .then(function(repo) {
        repository = repo;
        repository.getRemote("origin")
        .then(function(remote) {
            return remote.push
            (
                ["refs/heads/main:refs/heads/main"],
                {
                    callbacks: {
                        certificateCheck: () => 1,
                        credentials: function(url, userName) {
                            userName = "ylu0826";
                            console.log("url:" + url);
                            console.log("userName:" + userName);
                            // return Git.Cred.sshKeyFromAgent(userName);
                            // return Git.Cred.sshKeyNew( userName, "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");
                            return Git.Cred.userpassPlaintextNew("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", "x-oauth-basic");
                        }
                    }
            });
    })
    .catch(function(err) {
        console.log("fail to push: " + err.message);
    })

    res.sendFile(__dirname + "/public/index.html");
});
});

app.get("/pull/", function(req, res) { 
    console.log('github API is called, Pull');
    var repository;
    Git.Repository.open(path.resolve(__dirname, repoDir))
    .then(function(repo) {
        repository = repo;
        return repository.fetch("origin", {
            callbacks: {
                credentials: function(url, userName) {
                    return Git.Cred.sshKeyFromAgent(userName);
                }/*,
                certificateCheck: function() {
                    return 0;
                }*/
            }
        });
    })
    .then(function() {
        console.log("finished fetching");
        return repository.mergeBranches("master", "origin/master");
    });
   
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/lastCommit/", function(req, res) {
    var repository;
    Git.Repository.open(path.resolve(__dirname, repoDir))
    .then(function(repo) {
        repository = repo;
        return Git.Reference.nameToId(repo, "HEAD");
    })
    .then(function(head) {
        return repository.getCommit(head);
    })
    .then(function(parentResult) {
        var oid = parentResult.id().toString();
        res.send(oid);
    });
});

function commitFile(repo, fileName, commitMessage) {
    var index;
    var treeOid;
    var parent;

    return repo.refreshIndex()
        .then(function(indexResult) {
            index = indexResult;
        })
        .then(function() {
            return index.addByPath(fileName);
        })
        .then(function() {
            return index.write();
        })
        .then(function() {
            return index.writeTree();
        })
        .then(function(oidResult) {
            treeOid = oidResult;
            return Git.Reference.nameToId(repo, "HEAD");
        })
        .then(function(head) {
            return repo.getCommit(head);
        })
        .then(function(parentResult) {
            parent = parentResult;
            return Promise.all([
                Git.Signature.create("Jiayuan Li", "jiayli@microsoft.com", 123456789, 60),
                Git.Signature.create("Jiayuan Li", "jiayli@microsoft.com", 987654321, 90)
            ]);
        })
        .then(function(signatures) {
            var author = signatures[0];
            var committer = signatures[1];
      
            return repo.createCommit(
              "HEAD",
              author,
              committer,
              commitMessage,
              treeOid,
              [parent]);
        });
}