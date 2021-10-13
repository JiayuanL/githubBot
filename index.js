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

httpServer.listen(8000);
httpsServer.listen(8443);

app.use(bodyParser.urlencoded({
    extended:true
}));
  
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});
  
app.post("/commit/", function(req, res) { 

    var fileName = "superMagicDoc.txt";
    var fileContent = "hello world6";

    var repoDir = "../test";

    console.log('github API is called, files are commited');
    Git.Repository.open(repoDir)
    .then(function(repoResult) {
        repo = repoResult;
        return commitFile(repo, fileName, fileContent, "commit this");
    })
   
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/push/", function(req, res) { 
    var repoDir = "../test";
    console.log('github API is called, Push');
    Git.Repository.open(path.resolve(__dirname, repoDir))
    .then(function(repo) {
        repository = repo;
        repository.getRemote("origin")
        .then(function(remote) {
            return remote.push
            // (
            //     ['refs/heads/main:refs/heads/main'],
            //     null,
            //     repo.defaultSignature(),
            //     'Push to master'
            // )
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
                }
            )
            .catch(function(e) {
                console.log(e);
            });
        });
    })
   
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/pull/", function(req, res) { 

    let repoDir = 'C:\\Users\\luyun\\source\\repos\\test';
    console.log('github API is called, Pull');
    var repository;
    Git.Repository.open(path.resolve(repoDir))
    .then(function(repo) {
        repository = repo;
        return repository.fetch("origin", {
            callbacks: {
                credentials: function(url, userName) {
                    console.log("here"+userName);
                    return Git.Cred.sshKeyFromAgent(userName);
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
        return repository.mergeBranches("main", "origin/main");
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
                // Git.Signature.create("Jiayuan Li", "jiayli@microsoft.com", 123456789, 60),
                // Git.Signature.create("Jiayuan Li", "jiayli@microsoft.com", 987654321, 90)
                Git.Signature.create("Yun Lu", "ylu0826@foxmail.com", 123456789, 60),
                Git.Signature.create("Yun Lu", "ylu0826@foxmail.com", 987654321, 90)
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