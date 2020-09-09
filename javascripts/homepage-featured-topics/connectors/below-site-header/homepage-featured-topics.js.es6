import { ajax } from "discourse/lib/ajax";
import Topic from "discourse/models/topic";
import { withPluginApi } from "discourse/lib/plugin-api";

const FEATURED_CLASS = "homepage-featured-topics";

export default {
    setupComponent(args, component) {
        const topMenuRoutes = Discourse.SiteSettings.top_menu
            .split("|")
            .filter(Boolean)
            .map(route => `/${route}`);

        const homeRoute = topMenuRoutes[0];

        withPluginApi("0.1", api => {
            api.onPageChange(url => {

                const home = url === "/" || url.match(/^\/\?/) || url === homeRoute;

                let showBannerHere;
                if (settings.show_on === "homepage") {
                    showBannerHere = home;
                } else if (settings.show_on === "top_menu") {
                    showBannerHere = topMenuRoutes.indexOf(url) > -1 || home;
                } else {
                    showBannerHere = url.match(/.*/) && !url.match(/search.*/) && !url.match(/admin.*/);
                }

                if (showBannerHere) {
                    document.querySelector("html").classList.add(FEATURED_CLASS);

                    component.setProperties({
                        displayHomepageFeatured: true,
                        loadingFeatures: true
                    });

                    const titleElement = document.createElement("h2");
                    titleElement.innerHTML = settings.title_text;
                    component.set("titleElement", titleElement);

                    var topics_json = settings.featured_json;
                    if (settings.featured_tag != '') topics_json = `/tags/${settings.featured_tag}.json`;

                    // Get topics from url
                    ajax(topics_json)
                        .then(result => {

                            let customTopics = result.topic_list.topics;

                            // remove topic from category
                            # customTopics.forEach(function(topic, index) {
                            #     if (topic.category_id != "10") {
                            #         customTopics.push(topic);
                            #     }
                            # });

                            console.log(customTopics);

                            // result.topic_list.topics = customTopics;

                            // customFeaturedTopics
                            let customFeaturedTopics = [];
                            result.topic_list.topics
                                .slice(0, 4)
                                .forEach(topic =>
                                    customFeaturedTopics.push(Topic.create(topic))
                                );
                            component.set("customFeaturedTopics", customFeaturedTopics);

                            // customLatestTopicsLeft
                            let customLatestTopicsLeft = [];
                            result.topic_list.topics
                                .slice(4, 12)
                                .forEach(topic =>
                                    customLatestTopicsLeft.push(Topic.create(topic))
                                );
                            component.set("customLatestTopicsLeft", customLatestTopicsLeft);

                            // customLatestTopicsRight
                            let customLatestTopicsRight = [];
                            result.topic_list.topics
                                .slice(13, 29)
                                .forEach(topic =>
                                    customLatestTopicsRight.push(Topic.create(topic))
                                );
                            component.set("customLatestTopicsRight", customLatestTopicsRight);

                        })
                        .finally(() => component.set("loadingFeatures", false))
                        .catch(e => {
                            // the featured tag doesnt exist
                            if (e.jqXHR && e.jqXHR.status === 404) {
                                document.querySelector("html").classList.remove(FEATURED_CLASS);
                                component.set("displayHomepageFeatured", false);
                            }
                        });
                } else {
                    document.querySelector("html").classList.remove(FEATURED_CLASS);
                    component.set("displayHomepageFeatured", false);
                }

                if (settings.show_for === "everyone") {
                    component.set("showFor", true);
                } else if (
                    settings.show_for === "logged_out" &&
                    !api.getCurrentUser()
                ) {
                    component.set("showFor", true);
                } else if (settings.show_for === "logged_in" && api.getCurrentUser()) {
                    component.set("showFor", true);
                } else {
                    component.set("showFor", false);
                    document.querySelector("html").classList.remove(FEATURED_CLASS);
                }
            });
        });
    }
};
