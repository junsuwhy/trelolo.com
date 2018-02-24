<?php

global $page, $boardID, $cardID, $data, $apikey;
$page = new stdClass();

include_once('apikey.php');

main();


function main(){
  global $data, $page, $boardID, $cardID;
  $page->url = doRouter();
  $data = getJsonData($page->url);
  setPageVariables($data);

  $html = file_get_contents('./index.html');
  $replace = array(
    '<title>Trelolo.com</title>' => "<title>{$page->title}</title>",
    '<meta name="description" content="Trelolo 是一個把你的 Trello 公開板轉成網站的服務">' => '<meta name="description" content="{$pge->title}">',
    '<meta property="og:url" content="https://trelolo.com" />' => '<meta property="og:url" content="http://trelolo.com'.$page->url.'" />',
    '<meta property="og:title" content="Trelolo.com" />' => '<meta property="og:title" content="'.$page->title.'" />',
    '<meta property="og:description" content="Trelolo 是一個把你的 Trello 公開板轉成網站的服務" />' => '<meta property="og:description" content="'.$page->title.'" />',
    '<meta property="og:image"  content="" />' => '<meta property="og:image"  content="'.$page->og_image.'" />',
  );
  foreach ($replace as $key => $value) {
    $html = str_replace($key, $value, $html);
  }
  if($boardID){
    $html = str_replace('window.boardID = undefined;',  'window.boardID = "'.$boardID.'";', $html);
  }
  if($cardID){
    $html = str_replace('window.cardID = undefined;',  'window.cardID = "'.$cardID.'";', $html);
  }
  print($html);
}


function doRouter(){
  global $page;
  if(!empty($_GET)){
    foreach ($_GET as $key => $value) {
      if($key == 'q'){
        $q = $value;
      }elseif(preg_match('/^([bc])\/([^\/]+)/',$key)){
        $q = '/'.$key;
      }
    }
  }else{
    $q = '/b/XAL44x7M';
  }
  
  if(preg_match('/^\/([bc])\/([^\/]+)/',$q,$match_arr)){
    if($match_arr[1] == 'b'){
      global $boardID;
      $boardID = $match_arr[2];
    }
    if($match_arr[1] == 'c'){
      global $cardID;
      $cardID = $match_arr[2];
    } 
  }
  return $q;
}

function getJsonData($path){
  global $apikey;
  $url = "https://trello.com/{$path}.json?key={$apikey}";
  $json = file_get_contents($url);
  
  $data = json_decode($json);
  return $data;
}

function setPageVariables($data){
  global $page;
  $page->title = $data->name;
  if($data->pref->backgroundImage){
    $page->og_image = $data->pref->backgroundImage;
  }
}

?>
