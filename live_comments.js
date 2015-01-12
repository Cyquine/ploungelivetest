document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('more').textContent = 'Loading...';

    LAST_CALL = 0,
    NEXT_CALL_TIMEOUT = setTimeout(null);

    queries = {};
    for (var query_string = window.location.search.slice(1).split('&'), i = 0;
            i < query_string.length; i++) {
            var pair = query_string[i].split('=');
            queries[pair[0]] = pair[1];
    }
    if (!queries['subreddit']) queries['subreddit'] = 'MLPLounge';

    getComments.params = {'before': ''};
    if (queries['limit']) getComments.params['limit'] = queries['limit'];
    getComments();

    list.comments = [];
});

function getReddit(url, callback) {
    clearTimeout(NEXT_CALL_TIMEOUT);

    var request = new XMLHttpRequest();
    
    request.onload = function() {
        LAST_CALL = Date.now();
        if (this.status >= 200 && this.status < 400) {
            setTimeout(getComments, 2000);
            callback(JSON.parse(this.response));
        } else {
            setTimeout(getReddit, 2000, url);
        }
    }

    request.onerror = function() {
        document.getElementById('more').textContent = 'Please check connection';
        setTimeout(getReddit, 2000, url);
    };

    request.open('GET', url, true);
    request.send();
}

function getComments() {
    var params = [];
    for (var p in getComments.params) params.push(p + '=' + getComments.params[p]);

    getReddit('https://www.reddit.com/r/' + queries['subreddit'] +
                          '/comments.json?' + params.join('&'), function(data) {
        var new_comments = Array.prototype.unshift.apply(list.comments,
                                                      data['data']['children']);
        if (getComments.params['before'] === '') {
            getComments.params['before'] = list.comments[0]['data']['name'];
            list();
        } else if (new_comments > 0) {
            getComments.params['before'] = list.comments[0]['data']['name'];
            var more_button = document.getElementById('more');
            more_button.textContent = new_comments + ' new comment' +
                                                (new_comments === 1 ? '' : 's');
            more_button.className = 'faded-in';       
        }
    });
}

function list() {
    var comments = list.comments;
    list.comments = [];

    document.getElementById('more').className = 'faded-out';

    var parent = document.createDocumentFragment();
    for (var i = 0; i < comments.length; i++) {
        var c = comments[i]['data'];            

        var link_title = document.createElement('a');
        link_title.appendChild(document.createTextNode(c['link_title']));
        bpm(link_title);
        link_title.href = c['link_url'];
        link_title.target = '_blank';
        
        var link_author = document.createElement('a');
        link_author.appendChild(document.createTextNode(c['link_author']));
        link_author.className = 'author';
        link_author.href ='https://www.reddit.com/u/' + c['link_author'];
        link_author.target = '_blank';

        var subreddit = document.createElement('a');
        subreddit.appendChild(document.createTextNode('/r/' + c['subreddit']));
        subreddit.href = 'https://www.reddit.com/r/' + c['subreddit'];
        subreddit.target = '_blank';

        var link = document.createElement('p');
        link.appendChild(link_title);
        link.appendChild(document.createTextNode(' by '));
        link.appendChild(link_author);
        link.appendChild(document.createTextNode(' in '));
        link.appendChild(subreddit);
        link.className = 'link';

        var load_submission = document.createElement('button');
        add_loader(load_submission);
        load_submission.onclick = fetch;

        //if (link_title) // TODO finish
        // https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/master/lib/modules/showImages.js
        load_submission.className = /*loadable(c) ?*/ 'load'/* : 'unloadable'*/;
        
        var submission = document.createElement('div');
        submission.appendChild(load_submission);
        submission.appendChild(link);
        submission.id = c['link_id'].slice(3);
        submission.className = 'submission faded-out';

        var comment = document.createElement('div'),
            comment_wrapper = document.createElement('div');
        comment_wrapper.appendChild(comment);
        submission.appendChild(comment_wrapper);
        createComment(c, comment);

        parent.appendChild(submission);

        setTimeout(function (el){el.className = 'submission faded-in'},
                        100*(Math.min(comments.length - 1, 3) - i), submission);
    }

    var wrapper = document.getElementById('content');
    wrapper.insertBefore(parent, wrapper.firstChild);

    var hide_button = document.getElementById('hide');
    hide_button.textContent = 'Hide ' + Math.min(wrapper.children.length, 25);
    hide_button.className = 'faded-in';
}

function createComment(data, el) {
    var author = document.createElement('a');
    author.appendChild(document.createTextNode(data['author']));
    author.className = 'author';
    author.href = 'https://www.reddit.com/u/' + data['author'];
    author.target = '_blank';

    var created_text = document.createTextNode('');
    timestamp(created_text, data['created_utc']*1000);

    var created = document.createElement('time'),
        created_time = new Date(data['created_utc']*1000);
    created.appendChild(created_text);
    created.className = 'created';
    created.datetime = created_time.toISOString();
    created.title = created_time.toString();

    var load_parent = document.createElement('button');
    add_loader(load_parent);
    load_parent.className = 'load parent';
    load_parent.onclick = fetch_parent;

    var permalink = document.createElement('a');
    permalink.className = 'permalink';
    permalink.target = '_blank';
    permalink.href = 'https://www.reddit.com/r/MLPLounge/comments/' +
                                  data['link_id'].slice(3) + '/x/' + data['id'];

    var comment_header = document.createElement('div');
    comment_header.appendChild(load_parent);
    comment_header.appendChild(permalink);
    comment_header.appendChild(author);
    comment_header.appendChild(created);
    comment_header.className = 'comment-header';

    el.innerHTML = data['body_html'];
    el.innerHTML = el.firstChild.nodeValue;
    bpm(el);
    el.insertBefore(comment_header, el.firstChild);
    el.className = 'comment';
    // el.id = data['name']; // don't know if needed
    el.dataset.parent = data['parent_id'];
}

function fetch(el) {
    if (el.target) el = el.target; // el could be event or element

    for (var i = 0; i < el.children.length; i++) {
        el.children[i].classList.add('loading');
    }
}

function fetch_parent(event) {
    var el = event.target;
    el.disabled = true;
    for (var i = 0; i < el.children.length; i++) {
        el.children[i].classList.add('loading');
    }

    var root = el.parentNode.parentNode,
        parent = root.dataset.parent;
    if (root.previousSibling) {
        console.log(root.previousSibling);
        root.previousSibling.className = 'comment';
        finish();
    } else if (parent.slice(0, 3) === 't3_') {
        fetch(root.parentNode.parentNode.firstChild);
        finish();
    } else {
        var link = root.firstChild.childNodes[1].href;
        getReddit(link.slice(0, link.lastIndexOf('/') + 1) + parent.slice(3) +
                                             '.json?context=8', function(data) {
            // process submission




            finish();
        });
    }

    function finish() {
        for (var i = 0; i < el.children.length; i++) {
            var e = el.children[i];
            e.classList.remove('loading');
        }

        root.className = 'comment shifted-right';
        el.disabled = false;
    }
}