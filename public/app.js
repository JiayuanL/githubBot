var lastCommit = -1;
// setInterval(function(){
//     getLastCommit();
// }, 10 * 1000);


Office.onReady(function(){
    // When VBA code is saved, this action handler will get called on sdx side.
    Office.actions.associate('VBACodeSaved', function () {
    // enable "push" button
        document.getElementById("commitBtn").disabled = false;
    });
});

// When a local workspace is ready to import, host will get notified using this function.
async function importVbaCode() {
    var context = new Excel.RequestContext();
    var vbaproject = context.workbook.vbaproject;
    vbaproject.loadFromDisk("C:\\FHL2021Fall\\VBProject1");
    await context.sync();
    console.log("VBA code was successfully imported");
}


function onPullButtonClicked() {
    var xhr = new XMLHttpRequest();
    // we defined the xhr

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
            console.log("pull successfully");
            importVbaCode();
            // we get the returned data
            //document.getElementById("pullBtn").disabled = true;
        }

        // end of state change: it can be after some time (async)
    };

    xhr.open('GET', "http://localhost:8080/pull", true);
    xhr.send();
}

function onCommitButtonClicked() {
    var xhr = new XMLHttpRequest();
    // we defined the xhr

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
            console.log("commit successfully");
            document.getElementById("commitBtn").disabled = true;
            document.getElementById("pushBtn").disabled = false;
            //var data = JSON.parse(this.responseText);
            //importVbaCode();
            // we get the returned data
        }

        // end of state change: it can be after some time (async)
    };

    xhr.open('GET', "http://localhost:8080/commit", true);
    xhr.send();
}

function onPushButtonClicked() {
    var xhr = new XMLHttpRequest();
    // we defined the xhr

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
            console.log("push successfully");
            document.getElementById("pushBtn").disabled = true;
            //var data = JSON.parse(this.responseText);
            //importVbaCode();
            // we get the returned data
        }

        // end of state change: it can be after some time (async)
    };

    xhr.open('GET', "http://localhost:8080/push", true);
    xhr.send();
}

function getLastCommit() {
    var xhr = new XMLHttpRequest();
    // we defined the xhr

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        if (this.status == 200) {
            if (lastCommit == -1)
            {
                lastCommit = this.responseText;
            }
            else if (this.responseText != lastCommit)
            {
                document.getElementById("pullBtn").disabled = false;
                lastCommit = currentCommit;
            }
        }

        // end of state change: it can be after some time (async)
    };

    xhr.open('GET', "http://localhost:8080/lastCommit", true);
    xhr.send();
}
