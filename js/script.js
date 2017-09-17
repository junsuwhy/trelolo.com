showdown.setOption('simplifiedAutoLink',true);
showdown.setOption('openLinksInNewWindow',true);
showdown.setOption('simpleLineBreaks',true);
showdown.setOption('headerLevelStart',2);
showdown.setOption('tables',true);
showdown.setOption('parseImgDimensions',true);
showdown.setOption('disableForced4SpacesIndentedSublists',true);



var treloloBoardID = 'XAL44x7M';

var app = angular.module("page", ['ngSanitize']).config(function($sceDelegateProvider) {  
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain. **.
        'https://trello.com/**'
      ]);
}).config(function($locationProvider) {
    $locationProvider.html5Mode({ enabled: true, requireBase: false, rewriteLinks: false });
});

app.controller('MgCtrl',['$scope','$http','$sce',function($scope, $http, $sce){
    
    doRouter = function($scope){
        if(!location.search || location.search.match(treloloBoardID)){
            search = '?b/XAL44x7M';
            $scope.isTreloloDotCom = true;
        }else{
            search = location.search;
        }
        var reg = RegExp(/^\?([bc]+)\/([^\/]+)(?:\/([^\/]+))?/);
        var router = reg.exec(search);
        if(router){
            if(router[1] == 'b'){
                $scope.boardID = router[2];
                $scope.isHome = true;
                if( !$scope.myData ){
                    $scope.jsonUrl ='https://trello.com/b/'+$scope.boardID+'.json';
                    doUpdateFromBoardJson();
                    return;
                }
            }else if(router[1] == 'c'){
                $scope.cardID = router[2];
                if( !$scope.myData ){
                    $scope.jsonUrl ='https://trello.com/c/'+$scope.cardID+'.json';
                    doUpdateFromCardJson();
                    return;
                }
            }
        }
        setContent($scope);
    }
    
    setHeader = function($scope){
        if($scope.myData.prefs.backgroundImage){
            if(window.outerWidth > 960){
                $scope.bgImage = $scope.myData.prefs.backgroundImage;
            }else{
                var backgroundImageScaled = $scope.myData.prefs.backgroundImageScaled;
                for(var i=0;i< backgroundImageScaled.length;i++){
                    $scope.bgImage = backgroundImageScaled[i].url;
                    if(backgroundImageScaled[i].width > window.innerWidth)break;
                }
            }
        }else{
            $scope.bgColor = $scope.myData.prefs.backgroundColor;
        }
        if($scope.myData.prefs.backgroundBrightness == 'dark'){
            $scope.bgTextColor = 'white';
        }else{
            $scope.bgTextColor = 'black';
        }
        
    }
    
    setMenu = function($scope){
        var menu = [];
        var lists = $scope.myData.lists;
        lists.forEach(function(item){
            if(!item.closed){
                var object = {
                    title : item.name,
                    id : item.id,
                    children : [],
                }
                menu.push(object);   
            }
        });
        
        $scope.menu = menu;
        
        $scope.myData.cards.forEach(function(item){
            if(!item.closed){
                if(!$scope.homeCardId){
                    $scope.homeCardId = item.shortLink;
                }
                parent = getMenuParent($scope, item.idList);
                if(parent){
                    if(!item.desc){
                        var url = "#";
                    }else{
                        var reg = RegExp(/^http(s)?:\/\/[^\n]+$/);
                        if(reg.exec(item.desc)){
                            var url = item.desc;
                        }else{
                            var url = '/?c/'+item.shortLink;    
                        }
                    }
                    if(parent.children.length == 0){
                        if(parent.title == item.name){
                            parent.url = url;
                        }else{
                            parent.url = '#';
                        }
                    }
                    if(parent.children.length != 0 || parent.title != item.name){
                        parent.children.push({
                            title : item.name,
                            url : url,
                            shortLink : item.shortLink,
                        });
                    }
                }
            }
        });
        
        if(typeof postSetMenu != 'undefined'){
            postSetMenu();
        }
    }
    
    setContent = function($scope){
        $scope.isHome = false;
        if(!$scope.cardID){
            $scope.cardID = $scope.homeCardId;
            $scope.isHome = true;
        }
        else if($scope.cardID == $scope.homeCardId){
            $scope.isHome = true;
        }
        var cards = $scope.myData.cards.forEach(function(item){
            if(item.shortLink == $scope.cardID){
                $scope.title = item.name;
                var converter = new showdown.Converter();
                $scope.content = converter.makeHtml(item.desc);
                $scope.content = $sce.trustAsHtml($scope.content);
            }
        });
        document.title = $scope.title + ' | ' + $scope.myData.name;
        ga('set', 'page', location.search);
        ga('send', 'pageview');
    };
    
    getMenuParent = function($scope, menuID){
        var returnObj = null;
        $scope.menu.forEach(function(parent){
            if(parent.id.match(menuID)){
                returnObj = parent;
            }
        });
        return returnObj;
    };
    
    doUpdateFromCardJson = function(){
        var jsonUrl = $scope.jsonUrl;
        $http.get(jsonUrl)
        .then(function(response){
            $scope.boardID = response.data.actions[0].data.board.shortLink;
            $scope.jsonUrl = 'https://trello.com/b/'+$scope.boardID+'.json';
            doUpdateFromBoardJson();
        });
    }
    
    doUpdateFromBoardJson = function(){
        var jsonUrl = $scope.jsonUrl;
        $http.get(jsonUrl)
        .then(function(response){
            $scope.myData = response.data;
            setHeader($scope);
            setMenu($scope);
            setContent($scope);
        });
    }
    
    $scope.changeContent = function changeContent($event){
        var obj = $event.target;
        var href = obj.getAttribute('href');
        if(href == '#'){
            return
        }else{
            history.pushState(null,'',href);
            doRouter($scope);
            $event.preventDefault();
        }
    }

    $scope.doTransUrlToTrelolo = function(){
        var reg = RegExp(/^https:\/\/trello\.com\/([bc]\/[^\/]+)/);
        var regResult = reg.exec(this.urlFromTrello);
        if(regResult){
            this.urlToTrelolo = 'http://trelolo.com/?'+regResult[1];
            ga('send','event','generator','success',this.urlToTrelolo);
        }else{
            var reg_2 = RegExp(/trello\.com/);
            if(reg_2.exec(this.urlFromTrello)){
                ga('send','event','generator','failed',this.urlToTrelolo);      
            }
        }
    }

    $scope.doCopyText = function(){
        // copy by https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
        var copyTextarea = document.querySelector('.url-to-trelolo');
          copyTextarea.select();

          try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
          } catch (err) {
            console.log('Oops, unable to copy');
          }
    }

    init = function(){
        doRouter($scope);
        doUpdateFromBoardJson();
        $scope.doTransUrlToTrelolo();
    }

    init();
}]);