app.connectors = {
    open: function (html) {
        $('.overlay-content').html(html);
        $('body').addClass('overlay-open');
    },
    close: function () {
        $('body').removeClass('overlay-open');
        $('.overlay-content').empty();
    },

    fallbackImage: function (el) {
        el.src = "#{cdn( site.base_url + '/images/design/default_connector_200x150.png')}";
    },

    hideCodeSnippetIfEmpty: function (snippet_elem) {
        var snippet_value = snippet_elem.find('.snippet-value');
        if (!snippet_value.val()) {
            snippet_elem.hide();
        }
    },

    connectorFilter : function(container, target_product) {
        //Currently the only way to specify no limit
        var maxResults = 500;
        var url = app.dcp.url.search;

        //Query returns items where any of the three target products are set to the required product.
        var query = ["(sys_content_type: jbossdeveloper_connector AND (target_product_1: " + target_product + " OR target_product_2: " + target_product + " OR target_product_3: " + target_product + "))"];

        var request_data = {
            "field"  : ["_source"],
            "query" : query,
            "size" : maxResults
        };

        // append loading class to wrapper
        $("ul.results").addClass('loading');

        $.ajax({
            url : url,
            dataType: 'json',
            data : request_data,
            container : container,
            error : function() {
                $('ul.results').html(app.dcp.error_message);
            }
        }).done(function(data){
            var container = this.container || $('ul.results');
            app.connectors.format(data, container);
        });
    },

    format: function (data, container) {
        if (data.responses) {
            var hits = data.responses[0].hits.hits;
        } else {
            var hits = data.hits.hits;
        }
        hits.sortJsonArrayByProperty("_source.sys_title");

        var html = "";
        // loop over every hit
        for (var i = 0; i < hits.length; i++) {
            var props = hits[i]._source;

            props.img_path_thumb = "http://static.jboss.org/connectors/" + props.id + "_200x150.png";

            //If no 'long description', use the short one (before it is truncated)
            if (!('sys_content' in props)) {
                props.sys_content = props.sys_description;
            }
            
            //Limit the short description length, in-case the source data is invalid.
            if (props.sys_description.length > 150 ) {
                props.sys_description = props.sys_description.slice(0,146).concat(' ...');
            }
            
            //The templating fails if these values are undefined. There's probably a better way to do this.
            if (!props.code_snippet_1) {
                props.code_snippet_1 = '';
            }
            if (!props.code_snippet_2) {
                props.code_snippet_2 = '';
            }
            
            var connectorTemplate = app.templates.connectorTemplate;
            html += connectorTemplate.template(props);

        }

        container.html(html).removeClass('loading');
        container.prev().find("#connectors-results-label").html(hits.length);
    }
};


$(function () {

    $('ul.results').on('click','a.fn-open-connector',function(e){
        e.preventDefault();
        var overlay_content = $(this).parents('li').find('.connector-overlay-content');
        app.connectors.hideCodeSnippetIfEmpty(overlay_content.find('.connector-a'));
        app.connectors.hideCodeSnippetIfEmpty(overlay_content.find('.connector-b'));
        app.connectors.open(overlay_content.html());
    });

    $('.overlay-close').on('click', app.connectors.close);

    var targetProductFilter = $('[data-target-product]').data('target-product');
    app.connectors.connectorFilter($('ul.results'), targetProductFilter);
});

