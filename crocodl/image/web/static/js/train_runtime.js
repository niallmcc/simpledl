/*
 Copyright 2020 Niall McCarroll

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

runtime = null;
function boot_runtime() {
    runtime = new TrainRuntime();
}

class TrainRuntime extends Runtime {

    constructor() {
        super();
        var that = this;
        this.fileInput = $("upload_data_file");
        this.dataInfo = $("data_info");
        this.modelInfo = $("model_info");
        this.architectures = $("architectures");
        this.train_button = $("train_button");
        this.modelInput = $("upload_model_file");

        this.trainingProgress = $("training_progress");
        this.trainingStatus = $("training_status");
        this.chartTypes = $("chart_types");
        this.trainingGraph = $("training_graph");
        this.modelDownload = $("model_download");

        this.nr_epochs = $("nr_epochs");
        this.batch_size = $("batch_size");

        this.create_model = $("create_model");
        this.upload_model = $("upload_model");

        this.epoch = 0;

        this.fileInput.onchange = function() {
            that.setDataInfo("Uploading data...");
            var files = that.fileInput.files;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                that.upload(file, 'data_upload/', 'upload_data_progress',function(result) {
                    that.updateTrainingSettings();
                    that.checkStatus();
                });
            }
        }

        this.modelInput.onchange = function() {
            var files = that.modelInput.files;
            that.setModelInfo("Uploading model...");
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                that.upload(file, 'model_upload/', 'upload_model_progress',function(result) {
                    that.checkStatus();
                });
            }
        }

        this.architecture_names = [];

        this.train_button.onclick = function() {
            that.doTrain();
        }
        this.create_model.onchange = function() {
            that.updateTrainingSettings();
            that.checkStatus();
        }

        this.upload_model.onchange = function() {
            that.updateTrainingSettings();
            that.checkStatus();
        }

        this.nr_epochs.onchange = function() {
            that.updateTrainingSettings();
        }

        this.architectures.onchange = function() {
            that.updateTrainingSettings();
        }

        this.batch_size.onchange = function() {
            that.updateTrainingSettings();
        }

        this.chartTypes.onchange = function() {
            that.updateChartType();
        }

        this.data_ready = false;
        this.model_ready = false;
        this.training = false;
        this.checkStatus();
    }



    configureSelect(control,options,selected_option) {
        var old_value = control.value;
        control.innerHTML = "";
        for(var i=0; i<options.length; i++) {
            var n = options[i];
            var opt = document.createElement("option");
            opt.setAttribute("value",n);
            var tn = document.createTextNode(n);
            opt.appendChild(tn);
            control.appendChild(opt);
        }
        if (selected_option) {
            control.value = selected_option;
        } else {
            if (old_value) {
                for(var idx in options) {
                    if (old_value == options[idx]) {
                        control.value = old_value;
                        break;
                    }
                }
            }
        }
    }

    refreshControls() {
        if (this.training) {
            this.train_button.setAttribute("class","");
            this.train_button.disabled = true;
            this.modelInput.disabled = true;
            this.architectures.disabled = true;
            this.fileInput.disabled = true;
            this.create_model.disabled = true;
            this.upload_model.disabled = true;
        } else {
            this.fileInput.disabled = false;
            this.create_model.disabled = !this.data_ready;
            this.upload_model.disabled = !this.data_ready;
            this.train_button.setAttribute("class","button-primary");
            this.train_button.disabled = !(this.data_ready && this.model_ready);
            this.modelInput.disabled = true;
            this.architectures.disabled = true;
            if (this.create_model.checked && this.data_ready) {
                this.architectures.disabled = false;
            }
            if (this.upload_model.checked && this.data_ready) {
                this.modelInput.disabled = false;
            }
        }
    }

    setModelInfo(text) {
        this.modelInfo.innerHTML="";
        this.modelInfo.appendChild(document.createTextNode(text));
    }

    setDataInfo(text) {
        this.dataInfo.innerHTML="";
        this.dataInfo.appendChild(document.createTextNode(text));
    }

    setTrainingStatus(text) {
        this.trainingStatus.innerHTML="";
        this.trainingStatus.appendChild(document.createTextNode(text));
    }

    updateTrainingSettings() {
        var batch_size = Number.parseInt(this.batch_size.value);
        var nr_epochs = Number.parseInt(this.nr_epochs.value);
        var that = this;
        var create_or_update = "";
        if (this.create_model.checked) {
            create_or_update = "create";
        } else {
            create_or_update = "update";
        }
        fetch("update_training_settings.json", {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "batch_size":batch_size,
                "nr_epochs":nr_epochs,
                "architecture":that.architectures.value,
                "create_or_update":create_or_update
                })
        }).then((response) => {
                return response.json();
            })
            .then((update_status) => {
                that.checkStatus();
            });
    }

    updateChartType() {
        var value = this.chartTypes.value;
        var that = this;
        fetch("update_chart_type.json", {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"chart_type":value})
        }).then((response) => {
                return response.json();
            })
            .then((update_status) => {
                that.checkStatus();
                that.refreshTrainingGraph();
            });
    }


    doTrain() {
        var that = this;
        this.epoch = 0;
        fetch("launch_training.json", {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        }).then((response) => {
                return response.json();
            })
            .then((launch_status) => {
                var error = launch_status["error"]
                if (error) {
                    that.reportError(error);
                }
                that.checkStatus();
            });
    }

    reportError(msg) {
        alert(msg);
    }

    checkStatus() {
        var that = this;
        fetch("status.json")
            .then((response) => {
                return response.json();
            })
            .then((status) => {
                that.updateStatus(status);
                // if still training, schedule another check
                if (status["training"]) {
                    setTimeout(function() {
                        that.checkStatus();
                    },1000);
                }
            });
    }

    updateStatus(status) {
        var was_training = this.training;
        this.training = status["training"];

        var data_info = status["data_info"];
        if (data_info != null) {
            this.setDataInfo(JSON.stringify(data_info));
            this.data_ready = true;
        }

        var model_details = status["model_details"];
        var model_url = status["model_url"];
        var model_filename = status["model_filename"];
        var model_ready = status["model_ready"];
        var create_or_update = status["create_or_update"];
        if (create_or_update == "create") {
            this.create_model.checked = true;
        } else {
            this.upload_model.checked = true;
        }
        this.updateDownloadLink(model_filename,model_url);
        this.model_ready = model_ready;

        this.setModelInfo(JSON.stringify(model_details));


        var completed_epochs = status["epoch"];

        this.batch_size.value = ""+status["batch_size"];
        var orig_nr_epochs = this.nr_epochs.value;
        this.nr_epochs.value = ""+status["nr_epochs"];


        if (this.training) {
            var batch = status["batch"];
            var msg = "Training... Epoch "+completed_epochs+" / Batch "+batch;
            this.setTrainingStatus(msg);
        }

        this.trainingProgress.value = status["progress"] * 100;
        this.trainingProgress.textContent = this.trainingProgress.value;
        var that = this;

        if (this.training && completed_epochs != this.epoch || (was_training && !this.training)) {
            this.refreshTrainingGraph();
            this.epoch = completed_epochs;
        } else {
            if (this.nr_epochs.value != orig_nr_epochs) {
                this.refreshTrainingGraph();
            }
        }

        this.configureSelect(this.chartTypes,status["chart_types"],status["chart_type"]);
        this.architecture_names = status["architectures"];
        this.architecture = status["architecture"];
        this.configureSelect(this.architectures,this.architecture_names,this.architecture);
        this.refreshControls();
    }

    refreshTrainingGraph() {
        this.trainingGraph.contentWindow.location.reload(true);
    }

    updateDownloadLink(filename,url) {
        this.modelDownload.setAttribute("href",url);
        this.modelDownload.innerHTML = "";
        this.modelDownload.appendChild(document.createTextNode(filename));
    }
}


