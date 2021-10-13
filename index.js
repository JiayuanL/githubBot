var fs = require('fs');
var http = require('http');
var https = require('https');
var Git = require("nodegit");
var path = require("path");
var fse = require("fs-extra");
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
  
app.post("/commit/", function(req, res) { 

    var fileName = "newFile.txt";
    var fileContent = "111hello world11122233333";

    var repoDir = "C:/testRepo";

    console.log('github API is called, files are commited');
    Git.Repository.open(repoDir)
    .then(function(repoResult) {
        repo = repoResult;
        return commitFile(repo, fileName, fileContent, "commit this");
    })
   
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/push/", function(req, res) { 
    var repoDir = "C:/newRepo3";
    console.log('github API is called, Push');

    Git.Repository.open(path.resolve(__dirname, repoDir))
    .then(function(repo) {
        repository = repo;
        return repo.getRemote("origin"); //Get origin remote
    })
    .then(function(remote) {
        return remote.push(["refs/heads/master:refs/heads/master"], {
            callbacks: {
                credentials: function(url, userName) {
                    // console.log(userName);
                    // console.log(url);
                    console.log("Requesting creds");
                    //return Git.Cred.sshKeyFromAgent(userName);
                    //return Git.Cred.userpassPlaintextNew("jiayuanli1007@outlook.com", "Hello@1680!");
                    return Git.Cred.userpassPlaintextNew("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", "x-oauth-basic");
                    //return Git.Cred.userpassPlaintextNew("JiayuanLLL", "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");
                }
            }
        });
    })
    .catch(function(err) {
        console.log("fail to push: " + err.message);
    })
   
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/pull/", function(req, res) { 

    var repoDir = "C:/newRepo3";
    console.log('github API is called, Pull');
    var repository;
    Git.Repository.open(path.resolve(__dirname, repoDir))
    .then(function(repo) {
        repository = repo;
        return repository.fetch("origin", {
            callbacks: {
                credentials: function(url, userName) {
                    return Git.Cred.sshKeyFromAgent(userName);
                    //return Git.Credential.userpassPlaintextNew("jiayuanli1007@outlook.com", "Hello@1680!");
                }/*,
                certificateCheck: function() {
                    return 0;
                }*/
            }
        });
    })
    // Now that we're finished fetching, go ahead and merge our local branch
    // with the new one
    .then(function() {
        console.log("finished fetching");
        return repository.mergeBranches("master", "origin/master");
    });
   
    res.sendFile(__dirname + "/public/index.html");
});


function commitFile(repo, fileName, fileContent, commitMessage) {
    var index;
    var treeOid;
    var parent;
    return fse.writeFile(path.join(repo.workdir(), fileName), fileContent)
        .then(function() {
            return repo.refreshIndex();
        })
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

function createRepository(repoPath, isBare){
    // Create a new repository in a clean directory
    return fse.remove(repoPath)
    .then(function() {
        return fse.ensureDir(repoPath);
    })
    .then(function() {
        var bare = typeof isBare !== "undefined" ? isBare : 0;
        return Git.Repository.init(repoPath, bare);
    });
}