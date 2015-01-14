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
    if (!queries.subreddit) queries.subreddit = 'MLPLounge';
    document.title = 'comments: ' + queries.subreddit;

    getComments.params = {'before': ''};
    if (queries.limit) getComments.params.limit = queries.limit;
    getComments();

    list.comments = [];
    loaded_comments = {};
});

function getReddit(url, callback) {
    clearTimeout(NEXT_CALL_TIMEOUT);

    var delay;
    if ((delay = Date.now() - LAST_CALL - 2000) < 0) {
        setTimeout(getReddit, delay, url, callback);
    } else {
        var request = new XMLHttpRequest();
        
        request.onload = function() {
            LAST_CALL = Date.now();
            if (request.status >= 200 && request.status < 400) {
                setTimeout(getComments, 2000);
                callback(JSON.parse(request.response));
            } else {
                setTimeout(getReddit, 2000, url);
            }
        }

        request.onerror = function() {
            document.getElementById('more').textContent = 'Please check connection';
            setTimeout(getReddit, 2000, url);
        };

        request.open('GET', url);
        request.send();
    }
}

function getComments() {
    var params = [];
    for (var p in getComments.params) params.push(p + '=' + getComments.params[p]);

    getReddit('https://www.reddit.com/r/' + queries.subreddit +
                          '/comments.json?' + params.join('&'), function(data) {
        for (var comments = data.data.children, i = comments.length - 1; i >= 0; i--) {
            if (!loaded_comments[comments[i].data.name]) {
                loaded_comments[comments[i].data.name] = true;
                list.comments.unshift(comments[i]);
            }
        }

        var new_comments = list.comments.length;
        if (getComments.params.before === '') {
            getComments.params.before = list.comments[0].data.name;
            list();
        } else if (new_comments > 0) {
            getComments.params.before = list.comments[0].data.name;
            var more_button = document.getElementById('more');
            more_button.className = 'faded-in';

            var message = new_comments + ' new comment' + (new_comments === 1 ? '' : 's');
            more_button.textContent = message;

            document.title = message + ': ' + queries.subreddit;
        }
    });
}

function list() {
    var comments = list.comments;
    list.comments = [];

    document.getElementById('more').className = 'faded-out';
    document.title = 'comments: ' + queries.subreddit;

    var parent = document.createDocumentFragment();
    for (var i = 0; i < comments.length; i++) {
        var c = comments[i].data;

        var link_title = document.createElement('a');
        link_title.appendChild(document.createTextNode(c.link_title));
        bpm(link_title);
        link_title.href = c.link_url;
        link_title.target = '_blank';
        
        var link_author = document.createElement('a');
        link_author.appendChild(document.createTextNode(c.link_author));
        link_author.className = 'author submitter';
        link_author.href ='https://www.reddit.com/u/' + c.link_author;
        link_author.target = '_blank';

        var subreddit = document.createElement('a');
        subreddit.appendChild(document.createTextNode('/r/' + c.subreddit));
        subreddit.href = 'https://www.reddit.com/r/' + c.subreddit;
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
        
        var sub_header = document.createElement('div');
        sub_header.appendChild(load_submission);
        sub_header.appendChild(link);
        sub_header.className = 'sub-header';

        var submission = document.createElement('div');
        submission.appendChild(sub_header);
        submission.id = c.link_id.slice(3);
        submission.className = 'submission faded-out';

        var comment = document.createElement('div'),
            comment_wrapper = document.createElement('div');
        comment_wrapper.appendChild(comment);
        submission.appendChild(comment_wrapper);
        createComment(c, comment, c.link_author);
        comment_wrapper.className = 'comments';

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

function createComment(data, el, submitter) {
    var author = document.createElement('a');
    author.appendChild(document.createTextNode(data.author));
    author.className = 'author' + (data.author === submitter ? ' submitter' : '');
    author.href = 'https://www.reddit.com/u/' + data.author;
    author.target = '_blank';

    var created_text = document.createTextNode('');
    timestamp(created_text, data.created_utc*1000);

    var created = document.createElement('time');
    var created_time = new Date(data.created_utc*1000);
    created.appendChild(created_text);
    created.className = 'created';
    created.datetime = created_time.toISOString();
    created.title = created_time.toString();

    var load_parent = document.createElement('button');
    add_loader(load_parent);
    load_parent.className = 'load parent';
    load_parent.onclick = fetchParent;

    var load_child = document.createElement('button');
    add_loader(load_child);
    load_child.className = 'load child';
    load_child.onclick = fetchChild;

    var permalink = document.createElement('a');
    permalink.className = 'permalink';
    permalink.target = '_blank';
    permalink.href = 'https://www.reddit.com/r/' + data.subreddit +
                         '/comments/' + data.link_id.slice(3) + '/x/' + data.id;

    var comment_header = document.createElement('div');
    comment_header.appendChild(load_parent);
    comment_header.appendChild(permalink);
    comment_header.appendChild(author);
    comment_header.appendChild(created);
    comment_header.appendChild(load_child);
    comment_header.className = 'comment-header';

    el.innerHTML = data.body_html;
    el.innerHTML = el.firstChild.nodeValue;
    bpm(el);
    el.insertBefore(comment_header, el.firstChild);
    el.id = data.name;
    el.className = 'comment';
    el.dataset.parent = data.parent_id;

    loaded_comments[data.name] = {'element': el};
}

function fetch(el) {
    if (el.target) el = el.target; // el could be event or element
    load(el);
}

function fetchParent(event) {
    var el = event.target;
    el.disabled = true;
    load(el);

    var root = el.parentNode.parentNode,
        parent = root.dataset.parent;
    if (root.previousSibling) {
        moveEls();
    } else if (parent.slice(0, 3) === 't3_') {
        fetch(root.parentNode.parentNode.firstChild.firstChild);
        var placeholder = document.createElement('div');
        placeholder.className = 'comment-fake shifted-left';
        root.parentNode.insertBefore(placeholder, root);
        moveEls();
    } else if (loaded_comments[parent]) {
        var parent_loaded = loaded_comments[parent].element;
        var wrapper = root.parentNode, // TODO: work out what to do here
            last = root;
        do {
            var parent_parent = parent_loaded.previousSibling;
            parent_loaded.classList.remove('shifted-right');
            parent_loaded.classList.add('shifted-left');
            wrapper.insertBefore(parent_loaded, last);

            last = parent_loaded;
            parent_loaded = parent_parent;
        } while (parent_loaded);

        moveEls();
    } else {
        var link = root.firstChild.childNodes[1].href;
        getReddit(link.slice(0, link.lastIndexOf('/') + 1) + parent.slice(3) +
                                             '.json?context=8', function(data) {
            // TODO: process submission
            var submitter = data[0].data.children[0].data.author;
            var wrapper = root.parentNode;
            (function processComment(comment_data) {
                var last = comment_data.name !== parent ?
                    processComment(comment_data.replies.data.children[0].data) :
                    root;

                var comment = document.createElement('div');
                wrapper.insertBefore(comment, last);
                createComment(comment_data, comment, submitter);
                comment.classList.add('shifted-left');

                return comment;
            })(data[1].data.children[0].data);

            moveEls();
        });
    }

    function moveEls() {
        unload(el);

        var parent = root.previousSibling;
        var initial_height = parent.scrollHeight;
        parent.style.height = root.scrollHeight + 'px';
        parent.offsetHeight; // force reflow
        parent.classList.remove('shifted-left');
        adjustHeight(parent, initial_height);

        root.style.height = root.scrollHeight + 'px';
        root.className = 'comment shifted-right';     

        el.disabled = false;
    }
}

function fetchChild(event) {
    var el = event.target;
    el.disabled = true;
    load(el);

    var root = el.parentNode.parentNode,
        child = root.dataset.parent,
        child_loaded;
    if (root.nextSibling) {
        moveEls();
    }

    function moveEls() {
        unload(el);

        var child = root.nextSibling;
        var initial_height = child.scrollHeight;
        child.style.height = root.scrollHeight + 'px';
        child.offsetHeight; // force reflow
        child.classList.remove('shifted-right');
        adjustHeight(child, initial_height);

        root.style.height = root.scrollHeight + 'px';
        root.className = 'comment shifted-left';

        el.disabled = false;
    }
}

function adjustHeight(element, initial_height) {
    if (element.classList.contains('comment-fake')) {
        element.addEventListener('transitionend', function f(event) {
            var el = event.target;
            el.removeEventListener('transitionend', f);
            el.style.height = '0px';
            if (el.previousSibling) el.previousSibling.style.height = '';
            if (el.nextSibling) el.nextSibling.style.height = '';
        });
    } else {
        var c = loaded_comments[element.id];

        c.adjustHeightHandler = handler.bind(null, initial_height);

        element.addEventListener('transitionend', c.adjustHeightHandler);
    }

    function handler(initial_height, event) {
        var el = event.target;
        var comment = loaded_comments[el.id];

        if (event.propertyName !== 'height') {
            if (el.previousSibling) el.previousSibling.style.height = '';
            if (el.nextSibling) el.nextSibling.style.height = '';

            if (el.scrollHeight > el.offsetHeight) {
                el.style.height = el.scrollHeight + 'px';
                return;
            } else if (initial_height !== el.offsetHeight) {
                el.style.height = initial_height + 'px';
                return;
            }
        }
        el.removeEventListener('transitionend', comment.adjustHeightHandler);
        delete comment.adjustHeightHandler;
        el.style.height = '';
    }
}