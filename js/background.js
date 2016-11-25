var NooBoss={};

NooBoss.Util={};

NooBoss.Util.getIcon=function(appInfo,callback){
  var iconUrl=undefined;
  if(appInfo.icons){
    var maxSize=0;
    for(var j=0;j<appInfo.icons.length;j++){
      var iconInfo=appInfo.icons[j];
      if(iconInfo.size>maxSize){
        maxSize=iconInfo.size;
        iconUrl=iconInfo.url;
      }
    }
  }
  if(!iconUrl){
    var canvas=document.createElement("canvas");
    canvas.width=128;
    canvas.height=128;
    var ctx=canvas.getContext('2d');
    ctx.font="120px Arial";
    ctx.fillStyle="grey";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="white";
    ctx.fillText(appInfo.name[0],22,110);
    var dataUrl=canvas.toDataURL();
    callback(dataUrl);
  }
  else{
    dataUrlFromUrl(iconUrl,callback);
  }
}


//Management
NooBoss.Management={};
NooBoss.Management.updateAppInfo=function(appInfo,extraInfo){
  NooBoss.Util.getIcon(appInfo,function(dataUrl){
    appInfo.icon=dataUrl;
    getDB(appInfo.id,function(oldInfo){
      if(!oldInfo){
        oldInfo={};
        var time=new Date().getTime();
        oldInfo.installedDate=time;
        oldInfo.lastUpdateDate=time;
      }
      else{
        var time=new Date().getTime();
        oldInfo.lastUpdateDate=time;
      }
      $.extend(oldInfo,appInfo,extraInfo);
      setDB(appInfo.id,oldInfo);
    });
  });
}

NooBoss.Management.updateAppInfoById=function(id,updateInfo){
  getDB(id,function(oldInfo){
    if(oldInfo){
      $.extend(oldInfo,updateInfo);
      setDB(id,oldInfo);
    }
  });
}

NooBoss.Management.init=function(){
  chrome.management.getAll(function(appInfoList){
    for(var i=0;i<appInfoList.length;i++){
      var appInfo=appInfoList[i];
      NooBoss.Management.updateAppInfo(appInfo);
    }
  });
}

//History
NooBoss.History={};
NooBoss.History.addRecord=function(record){
  console.log(record);
  getDB('history_records',function(recordList){
    if(!recordList){
      recordList=[];
    }
    record.date=new Date().getTime();
    recordList.push(record);
    setDB('history_records',recordList);
  });
}
NooBoss.History.listen=function(){
  chrome.management.onInstalled.addListener(function(appInfo){
    NooBoss.History.addRecord({category:'installation', id:appInfo.id, icon: appInfo.icon, event:appInfo.name+' has been added to your browswer'});
    NooBoss.Management.updateAppInfo(appInfo);
    chrome.notifications.create({
      type:'basic',
      iconUrl: '/images/icon_128.png',
      title: 'Added: '+appInfo.type,
      message: appInfo.name+' has been added to your browswer'
    });
  });
  chrome.management.onUninstalled.addListener(function(id){
    getDB(id,function(appInfo){
      NooBoss.History.addRecord({category:'removal', id:appInfo.id, icon: appInfo.icon, event:appInfo.name+' has been removed from your browswer'});
    });
    NooBoss.Management.updateAppInfoById(id,{uninstalledDate:new Date().getTime()});
    chrome.notifications.create({
      type:'basic',
      iconUrl: '/images/icon_128.png',
      title: 'Removed '+id,
      message: id+' has been removed from your browswer'
    });
  });
  chrome.management.onEnabled.addListener(function(appInfo){
    NooBoss.History.addRecord({category:'enabled', id:appInfo.id, icon: appInfo.icon, event:appInfo.name+' is now enabled'});
    chrome.notifications.create({
      type:'basic',
      iconUrl: '/images/icon_128.png',
      title: 'Enabled: '+appInfo.name,
      message: appInfo.name+' is now enabled'
    });
  });
  chrome.management.onDisabled.addListener(function(appInfo){
    NooBoss.History.addRecord({category:'disabled', id:appInfo.id, icon: appInfo.icon, event:appInfo.name+' is now disabled'});
    chrome.notifications.create({
      type:'basic',
      iconUrl: '/images/icon_128.png',
      title: 'Disabled: '+appInfo.name,
      message: appInfo.name+' is now disabled'
    });
  });
}


NooBoss.init=function(){
  NooBoss.History.listen();
  NooBoss.Management.init();
}

document.addEventListener('DOMContentLoaded', function(){
  NooBoss.init()
});
