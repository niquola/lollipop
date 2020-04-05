(ns igpop.site.utils
  (:require [clojure.string :as str]))

(defn href [ctx & pth]
  (let [[pth opts] (if (map? (last pth))
                     [(butlast pth) (last pth) ]
                     [pth {}])
        fmt (when-let [fmt (:format opts)]
              (str "." fmt))
        res (if-let [bu (:base-url ctx)]
              (str (str/join "/" (into [bu] pth)) fmt)
              (str "/" (str/join "/" pth) fmt))]
    res))

(defn p [v k] (prn v) v)

(defn generate-docs-href [ctx]
  (let [docs (:pages (:docs ctx))
        doc-folder (last (keys (into (sorted-map) docs)))
        basic-exists? (if (some? doc-folder)
                        (if (:basic (doc-folder docs)) :basic))
        doc-instance (if (some? doc-folder)
                       (or basic-exists?
                           (last (keys (into (sorted-map) (doc-folder docs))))))
        doc-link (if (and doc-folder doc-instance)
                   (href ctx  "docs" (name doc-folder) (str (name doc-instance) ".html"))
                   (href ctx "docs"))]
    doc-link))

(defn deep-merge
  [& maps]
  (letfn [(m [& xs]
            (if (some #(and (map? %) (not (record? %))) xs)
              (apply merge-with m xs)
              (last xs)))]
    (reduce m maps)))
