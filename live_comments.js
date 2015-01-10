function div(a, b) {return (a-a%b)/b} // integer division

var LAST_CALL = 0,
    NEXT_CALL_TIMEOUT = setTimeout(undefined);

document.getElementById('more').onclick = list;

function getComments() {
    clearTimeout(NEXT_CALL_TIMEOUT);

    var param_string = [];
    for (var param in getComments.params) {
        param_string.push(param + '=' + getComments.params[param]);
    }

    var script = document.createElement('script');
    script.src = 'https://www.reddit.com/r/mlplounge/comments.json?' +
                                                         param_string.join('&');
    document.body.appendChild(script);
    LAST_CALL = Date.now();
    document.body.removeChild(script);
}
getComments.params = {'jsonp': 'more'};
getComments();

function more(raw) {
    if (document.getElementById('content').childNodes.length === 0) {
        list.raw = raw;
        list();
    } else if ((new_comments = raw['data']['children'].length) > 0) {
        list.raw = raw;
        var button = document.getElementById('more');
        button.textContent = new_comments + ' new comment' +
                                                (new_comments === 1 ? '' : 's');
        button.className = 'fadedin';       
    }
    setTimeout(getComments, 2000);
}

function list() {
    document.getElementById('more').className = 'fadedout';
    var comments = list.raw['data']['children'];
    list.raw = {};
    var parent = document.createDocumentFragment();

    for (var i = 0; i < comments.length; i++) {
        var c = comments[i]['data'];            

        var link_title = document.createElement('a');
        link_title.appendChild(document.createTextNode(c['link_title']));
        link_title.setAttribute('target', '_blank');
        link_title.setAttribute('href', c['link_url']);

        var link_author = document.createElement('a');
        link_author.className = 'author';
        link_author.appendChild(document.createTextNode(c['link_author']));
        link_author.setAttribute('target', '_blank');
        link_author.setAttribute('href', 'https://www.reddit.com/u/' +
                                                              c['link_author']);

        var link = document.createElement('p');
        link.className = 'link';
        link.appendChild(link_title);
        link.appendChild(document.createTextNode(' by '));
        link.appendChild(link_author);

        var author = document.createElement('a');
        author.className = 'author';
        author.appendChild(document.createTextNode(c['author']));
        author.setAttribute('target', '_blank');
        author.setAttribute('href', 'https://www.reddit.com/u/' + c['author']);
        
        var created_text = document.createTextNode('');
        timestamp(created_text, c['created_utc']*1000);

        var created = document.createElement('time'),
            created_time = new Date(c['created_utc']*1000);
        created.className = 'created';
        created.appendChild(created_text);
        created.setAttribute('datetime', created_time.toISOString());
        created.setAttribute('title', created_time.toString());        

        var load_submission = document.createElement('button');
        load_submission.className = 'load';
        // load_submission.setAttribute('onclick');

        var last_comment = document.createElement('button');
        last_comment.className = 'load';

        var permalink = document.createElement('a');
        permalink.appendChild(document.createTextNode('r'));
        permalink.setAttribute('target', '_blank');
        permalink.setAttribute('href',
                    ['https://www.reddit.com/r/MLPLounge/comments', 
                    c['link_id'].slice(3), c['link_title'], c['id']].join('/'));
        permalink.className = 'load';

        var comment_header = document.createElement('div');
        comment_header.appendChild(last_comment);
        comment_header.appendChild(permalink);
        comment_header.appendChild(author);
        comment_header.appendChild(created);
        comment_header.className = 'comment-header';

        var comment = document.createElement('div');
        comment.innerHTML = c['body_html'];
        comment.innerHTML = comment.firstChild.nodeValue;
        comment.insertBefore(comment_header, comment.firstChild);
        comment.className = 'comment';
        
        var submission = document.createElement('div');
        submission.appendChild(load_submission);
        submission.appendChild(link);
        submission.appendChild(comment);
        submission.className = 'submission fadedout';
        parent.appendChild(submission);

        setTimeout(function (el) {el.className = 'submission fadedin'},
            50*(Math.min(comments.length, 3) - i), submission);
    }

    var wrapper = document.getElementById('content');
    wrapper.insertBefore(parent, wrapper.firstChild);

    getComments.params['before'] = comments[0]['data']['name'];
}

function timestamp(el, created) { // sets live timestamp, then sleeps again
    var age = Date.now() - created;

    var value;
    if (value = div(age, 86400000)) { // assignments intended
        el.nodeValue = value + ' day' + (value === 1 ? '' : 's') + ' ago';
        setTimeout(timestamp, (value+1)*86400000 - age, el, created);
    } else if (value = div(age, 3600000)) {
        el.nodeValue = value + ' hour' + (value === 1 ? '' : 's') + ' ago';
        setTimeout(timestamp, (value+1)*360000 - age, el, created);
    } else if (value = div(age, 60000)) {
        el.nodeValue = value + ' minute' + (value === 1 ? '' : 's') + ' ago';
        setTimeout(timestamp, (value+1)*60000 - age, el, created);
    } else {
        el.nodeValue = 'just now';
        setTimeout(timestamp, 60000 - age, el, created);
    }    
}