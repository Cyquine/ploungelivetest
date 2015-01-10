var LAST_CALL = 0,
    NEXT_CALL_TIMEOUT = setTimeout(undefined);

function getComments() {
    var script = document.createElement('script');
    script.setAttribute('src',
         'https://www.reddit.com/r/mlplounge/comments.json?jsonp=more&before=' +
                                                            getComments.before);
    document.body.appendChild(script);
    LAST_CALL = Date.now();
    document.body.removeChild(script);
}
getComments.before = '';
getComments();

function more(data) {
    new_comments = Array.prototype.unshift.apply(list.comments,
                                                      data['data']['children']);
    if (getComments.before === '') {
        getComments.before = list.comments[0]['data']['name'];
        list();
    } else if (new_comments > 0) {
        getComments.before = list.comments[0]['data']['name'];
        var more_button = document.getElementById('more');
        more_button.textContent = new_comments + ' new comment' +
                                                (new_comments === 1 ? '' : 's');
        more_button.setAttribute('class', 'faded-in');       
    }
    setTimeout(getComments, 2000);
}

function list() {
    var comments = list.comments;
    list.comments = [];

    document.getElementById('more').setAttribute('class', 'faded-out');

    var parent = document.createDocumentFragment();
    for (var i = 0; i < comments.length; i++) {
        var c = comments[i]['data'];            

        var link_title = document.createElement('a');
        link_title.appendChild(document.createTextNode(c['link_title']));
        link_title.setAttribute('target', '_blank');
        link_title.setAttribute('href', c['link_url']);

        var link_author = document.createElement('a');
        link_author.appendChild(document.createTextNode(c['link_author']));
        link_author.setAttribute('class', 'author');
        link_author.setAttribute('target', '_blank');
        link_author.setAttribute('href', 'https://www.reddit.com/u/' +
                                                              c['link_author']);

        var link = document.createElement('p');
        link.appendChild(link_title);
        link.appendChild(document.createTextNode(' by '));
        link.appendChild(link_author);
        link.setAttribute('class', 'link');

        var author = document.createElement('a');
        author.appendChild(document.createTextNode(c['author']));
        author.setAttribute('class', 'author');
        author.setAttribute('target', '_blank');
        author.setAttribute('href', 'https://www.reddit.com/u/' + c['author']);
        
        var created_text = document.createTextNode('');
        timestamp(created_text, c['created_utc']*1000);

        var created = document.createElement('time'),
            created_time = new Date(c['created_utc']*1000);
        created.appendChild(created_text);
        created.setAttribute('class', 'created');
        created.setAttribute('datetime', created_time.toISOString());
        created.setAttribute('title', created_time.toString());

        var load_submission = document.createElement('button');
        add_loader(load_submission);
        load_submission.setAttribute('class', 'load');
        load_submission.setAttribute('onclick', 'fetch(this)');

        var load_parent = document.createElement('button');
        add_loader(load_parent);
        load_parent.setAttribute('class', 'load parent');
        load_parent.setAttribute('onclick', 'fetch_parent(this)');

        var permalink = document.createElement('a');
        permalink.setAttribute('class', 'permalink');
        permalink.setAttribute('target', '_blank');
        permalink.setAttribute('href', 'https://www.reddit.com/r/MLPLounge/' +
                         'comments/' + c['link_id'].slice(3) + '/x/' + c['id']);

        var comment_header = document.createElement('div');
        comment_header.appendChild(load_parent);
        comment_header.appendChild(permalink);
        comment_header.appendChild(author);
        comment_header.appendChild(created);
        comment_header.setAttribute('class', 'comment-header');

        var comment = document.createElement('div');
        comment.innerHTML = c['body_html'];
        comment.innerHTML = comment.firstChild.nodeValue;
        comment.insertBefore(comment_header, comment.firstChild);
        comment.setAttribute('class', 'comment');
        
        var submission = document.createElement('div');
        submission.appendChild(load_submission);
        submission.appendChild(link);
        submission.appendChild(comment);
        submission.setAttribute('class', 'submission faded-out');

        parent.appendChild(submission);

        setTimeout(function (el) {el.className = 'submission faded-in'},
            100*(Math.min(comments.length - 1, 3) - i), submission);
    }

    var wrapper = document.getElementById('content');
    wrapper.insertBefore(parent, wrapper.firstChild);

    document.getElementById('hide').textContent = 'Hide ' +
                                          Math.min(wrapper.children.length, 25);

}
list.comments = [];

function fetch(el) {
    for (var i = 0; i < el.children.length; i++) {
        el.children[i].className += ' loading';
    }
}

function fetch_parent(el) {
    for (var i = 0; i < el.children.length; i++) {
        el.children[i].className += ' loading';
    }
}