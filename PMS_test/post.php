<?php

date_default_timezone_set("Asia/Taipei");

// 1️⃣ 產生時間
$timestamp = time();
$nowTime   = date("Y-m-d H:i:s", $timestamp);

// 2️⃣ 計算 password
$password = md5("STARBIT2026" . $nowTime);   // STARBIT2026 是(你們的密碼 )   

// 3️⃣ 組資料
$data = array(
    "account"   => "STARBIT",			//STARBIT 是 (你們的帳號)
    "password"  => $password,		//傳遞的密碼是  md5((你們的密碼 ).時戳 )
    "timestamp" => $nowTime,     //時戳
    "hotelcode" => "ZH01",		//館店代號
    "roomtype"  => "V7",     //  如果不是指定房型就  null 或者  放空
    "startdate" => "2026-01-01",   //過去的日期不會顯示
    "enddate"   => "2026-04-30"     //會顯示到指定的範圍內  庫存沒有的則不顯示
);

// 4️⃣ 轉 JSON
$jsonData = json_encode($data);

// 5️⃣ API URL
$url = "https://www.booking-wise0.com.tw/hotel_conn/jsonRPN.php";     //查詢的URL

// 6️⃣ 初始化 CURL
$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Content-Length: ' . strlen($jsonData)
));

// SSL 驗證（測試可關，正式請打開）
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// 7️⃣ 執行
$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo "Curl Error: " . curl_error($ch);
} else {
    
   echo $response;
}

curl_close($ch);

?>