'use strict';

if ('serviceWorker' in navigator) {
    console.log('Service Worker is supported');
    navigator.serviceWorker.register('sw.js').then(function(reg) {
        console.log(':^)', reg);
        reg.pushManager.subscribe({
            userVisibleOnly: true
        }).then(function(sub) {
            console.log('endpoint:', sub.endpoint);
        });
    }).catch(function(error) {
        console.log(':^(', error);
    });
}
$('#send-notification').click(function() {
    $.post({
        url: 'https://gcm-http.googleapis.com/gcm/send',
        headers: { 'Authorization': 'key=AIzaSyAGLdy1bqZ_rcukcNEY9zAkW1NOxsI8eLQ',
            'Content-Type': 'application/json' },
        data: JSON.stringify({
                "notification": {
                    "title": "Portugal vs. Denmark",
                    "text": "5 to 1"
                },
                "to" : "cDSkSkUXimY:APA91bGju4ks5330qZ-r7AW31cQT2tGDVpGBpzHHth61FRDlgHoO1BUJ-T94o4Mfu6vy72IY6alsCl1WFpR9ZV8eKO1XmDKR3Z9PzpblJmd1mFgTZLodd8saaW7IWKv1GBT800zxdclw"
            })
        }
    );
});
