showdown.setOption('simplifiedAutoLink',true);
showdown.setOption('openLinksInNewWindow',true);
showdown.setOption('simpleLineBreaks',true);
showdown.setOption('headerLevelStart',2);
showdown.setOption('tables',true);

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
            search = '?XAL44x7M';
            $scope.isTreloloDotCom = true;
        }else{
            search = location.search;
        }
        var reg = RegExp(/\?([^\/]+)(\/([^\/]+))?/);;
        var router = reg.exec(search);
        if(router){
            $scope.boardID = router[1]
            if(router[3]){
                $scope.cardID = router[3];    
            }else{
                $scope.isHome = true;
            }
            $scope.jsonUrl ='https://trello.com/b/'+$scope.boardID+'.json';
        }
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
                            var url = item.desc
                        }else{
                            var url = '/?'+$scope.boardID +'/'+item.shortLink;    
                        }
                    }
                    parent.children.push({
                        title : item.name,
                        url : url,
                        shortLink : item.shortLink
                    });
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
    
    $scope.changeContent = function changeContent($event){
        var obj = $event.target;
        var href = obj.getAttribute('href');
        if(href == '#'){
            return
        }else{
            $scope.cardID = href.match(/\?(.+)\/(.+)/)[2];
            $event.preventDefault();
            setContent($scope);
            history.pushState(null,'',href);
        }
    }

    $scope.doTransUrlToTrelolo = function(){
//        this.urlFromTrello = 'https://trello.com/b/XAL44x7M/boardname';
        var reg = RegExp(/^https:\/\/trello\.com\/b\/([^\/]+)/);
        var regResult = reg.exec(this.urlFromTrello);
        if(regResult){
            this.urlToTrelolo = 'http://trelolo.com/?'+regResult[1];
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
        var jsonUrl = $scope.jsonUrl;
        $http.get(jsonUrl)
            .then(function(response){
                $scope.myData = response.data;
                setHeader($scope);
                setMenu($scope);
                setContent($scope);
            });
        $scope.urlFromTrello = 'https://trello.com/b/XAL44x7M';
        $scope.doTransUrlToTrelolo();
    }

    init();
}]);