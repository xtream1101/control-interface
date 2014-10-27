_.templateSettings = {interpolate: /\{\{(.+?)\}\}/g};
var sendCmdUrl = "./modules/pyCtrl/getScriptData.php";


var Script = {
    _template: _.template(
        '<div id="script-{{name}}" class="context-menu-pyCtrl-scripts">' +
        '   <div id="script-{{name}}-dialog" class="dialog" title="{{name}}"></div>' +
        '   <span class="script-status"></span>' +
        '   <span class="script-name">{{name}}</span>' +
        '   <span class="script-uptime">{{uptime}}</span>' +
        '</div>'
    ),
    dialogIntervals: {},
    init: function(){
        Script.sendCommand('/script/list',function(scripts){
            _.each(scripts.all, function(script){
                $('#scriptsContainer').append(Script._template(script));
                var $scriptBox = $("#script-"+script.name);
                //$scriptBox.find('button').on('click',function(e){
                //    Script.cmd(e, script.name);
                //});
                $("#script-"+script.name+"-dialog").dialog({
                    autoOpen: false,
                    close: function( event, ui ){
                        window.clearInterval(Script.dialogIntervals[script.name]);
                        Script.dialogIntervals[script.name] = undefined;
                    }
                });
            });
        }).done(function() {
            var refreshInt = setInterval(Script.refreshList, 1000);
        });
    },
    sendCommand: function(cmd_, cb){
        return $.getJSON(sendCmdUrl + "?cmd=" + cmd_, function (response) {
            cb(response);
        });
    },
    refreshList: function(){
        Script.sendCommand('/script/list',function(scripts){
            _.each(scripts.all, function(script) {
                var color = 'gray';
                if (script.enabled) {
                    if (script.running) {
                        color = 'red';
                    } else if (!script.running) {
                        color = 'green';
                    }
                }
                var $scriptBox = $("#script-"+script.name);
                $scriptBox.find('.script-status').css({
                    backgroundColor: color
                });
                $scriptBox.find('.script-uptime').html(script.uptime);
            });
        })
    },
    cmd: function(cmd_, name){
        if(cmd_ == '/script/'+name+'/output/live'){
            var $dialogBox = $("#script-"+name+"-dialog");
            if(typeof Script.dialogIntervals[name] === 'undefined'){
                $dialogBox.dialog("open");
                Script.dialogIntervals[name] = setInterval(function(){
                    Script.sendCommand(cmd_,function(response){
                        $dialogBox.html('');
                        _.each(response.output, function(line){
                            $dialogBox.append(line+"<br>");
                        })
                    });
                }, 500);
            }else{
                $dialogBox.dialog("close");
                window.clearInterval(Script.dialogIntervals[name]);
                Script.dialogIntervals[name] = undefined;
            }
        }else{
            Script.sendCommand(cmd_, function (response) {
                $("#scriptResponse").html(response.output);
            });
        }
    }
}; //END var Script


Script.init();


$.contextMenu({
    selector: '.context-menu-pyCtrl-scripts',
    trigger: 'left',
    build: function($trigger, e){
        var $scriptName = $trigger.find(".script-name").html();
        return {
            callback: function (key, options) {
                var cmd = '/script/'+$scriptName+'/'+key;
                Script.cmd(cmd, $scriptName);
            }
        };
    },
    items: {
        "enable": {name: "Enable"},
        "disable": {name: "Disable"},
        "run": {name: "Run"},
        "stop": {name: "Stop"},
        "sep1": "---------",
        "output/live": {name: "Live Output"}
    }
});