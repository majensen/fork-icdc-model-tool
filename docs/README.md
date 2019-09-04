<link rel='stylesheet' href="assets/style.css">
<link rel='stylesheet' href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css" integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==" crossorigin="">
<script type="text/javascript" src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<script type="text/javascript"  src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js"></script>
<script type="text/javascript" src="assets/actions.js"></script>

<select id="node_select">
  <option value="">Zoom to Node</option>
</select>
<div id="model"></div>

[Model artifacts](./model-desc)

# MakeModel and model-tool

## Overview

The MakeModel "framework" takes a convenient, human-readable
description of an overall graph model, laid out in one or two YAML
files, and uses these to create the node schemas required to specify
the model in the Gen3 system.

The command-line tool `model-tool` takes the schema description files
as input, and performs the following tasks

* Creates the node schema YAML files required for Gen3 ("schema YAMLs")
* Creates the JSON aggregation of all node YAML files (the "dictionary JSON")
* Creates an SVG graphical representation of the model as specified;
* Provides error checking and warnings relevant to model
  specification, e.g., identifying nodes that do not have any incoming
  or outgoing relationships ("edges").

## Installing `model-tool`

* MakeModel is written in Perl. If you don't have Perl,
[get it](https://www.perl.org/get.html). On Windows, I recommend
Strawberry Perl.

* Get [GraphViz](http://www.graphviz.org/) if you want to use the
graphic output feature.

* Clone this repo 

        git clone https://github.com/CBIIT/icdc-model-tools.git 

* Move to `make-model` directory 

        cd icdc-model-tools/make-model 

* Easy build:

  * Get the "cpanminus" tool:

        curl -L https://cpanmin.us | perl - App::cpanminus     # or
        wget -O - https://cpanmin.us | perl - App::cpanminus

  * Run cpanm to install

        cpanm .

    which will pull in all dependencies, run tests and install the
    script.

* Try it:

        model-tool

  and the Usage hints should display:

```
FATAL: Nothing to do!
 (2019/01/29 23:12:31 in main::)
Usage:
      model-tool [-g <graph-out-file>] [-s <output-dir>] [-j <json-out-file>] <input.yaml> [<input2.yaml> ...]
         [-d dir_to_search [-d another_dir...]]
      -g : create an SVG of model defined in input.yamls 
      -s : create schema node files for Gen3
      -j : create big json schema squirt
      -d : directory to search for native schema yamls for inclusion
      -a : output all nodes, including unlinked nodes
      -v : verbosity (-v little ... -vvvv lots)
      -W : show all warnings ( = -vvv )
      --dry-run : emit log msg, but no output files
```

## Graph Description Input YAML

The layout of nodes, relationships, node properties, and relationship
properties are specified in data structure expressed in YAML files.

The input format follows these general conventions:

* Special key names are capitalized; these are essentially directives
to ModelMaker;

* Custom names, such as names of nodes and properties, are all lower
case, with underscores replacing any spaces ("snakecase");

Input to `model-tool` can be a single YAML file, or multiple YAML
files. If multiple files are given, the data structures are merged, so
that, for example, nodes and relationships can be described in one
file, and property definitions can be provided in a separate file.

Collectively, the input YAMLs can be called "model description
files". These are distinct from Gen3 configuration YAML files output
by the tool, called "schema" or "dictionary" files.

### Nodes

The `Nodes` top-level key points to an object containing descriptions
of each node type in the model. Node descriptions look like:

    <nodename> :
        Category: <categoryname>
        UniqueKeys:
            - [ 'propnameA', 'propnameB', ... ]
            - [ ... ]
            - ...
        Props:
           - <propname1>
           - <propname2>
           - ...

A node type can have a defined category, or a default (which can be
configured) will be used in the final output.

The `UniqueKeys` key points to an array of arrays. Each bottom-level
array is a list (which can be of length 1) of node property
names. This specifies that nodes of this type that are created in the
system must be unique with respect to the set of values for the
properties indicated. For example, `['id']` here indicates that the
value for the property `id` must be unique for all nodes of the
type. `['project_id', 'submitter_id']` indicates that the submitter id
must be unique among all nodes having a given project_id value.

The `Props` key points to a simple array of property names given as
strings. The detailed definition of each property (e.g., value type or
enumeration, required status) are provided once, in a separate top-level
section, `PropDefinitions` ([see below](#Property Definitions)).

### Relationships

The `Relationships` top-level key points to an object of descriptions of
each relationship type. Relationship descriptions look like:

    <relname>:
         Props:
             - <propname>
         Req: [ true | false ]
         Mul: [ one_to_one | many_to_one | many_to_many | one_to_many ]
         Ends:
            - Src: <nodename1>
               Dst: <nodename2>
            - Src: <nodename...>
               ...

A named relationship can have properties defined, analogous to
nodes.

A named relationship can be specified as required with the `Req` key,
and its multiplicity (from source node type to destination node type)
with the `Mul` key.

A given named relationship can be formed between different source and
destination node type pairs. The `Ends` key points to an array of `{ Src, Dst }`
objects that describe the allowed pairs.

### Property Definitions

The `PropDefinitions` top-level key points to an object of
descriptions of each property. Property descriptions look like:

    <propname1>:
        Term: <term reference token>
        # e.g., for $ref: "_terms.yaml#/ajcc_clinical_m", 
        # use 'ajcc_clinical_m'
        Desc: "a description of the property"
        Type: <string|number> # or the following:
        Enum:
            - acceptable
            - values
            - for
            - property
            - go
            - here
        Nul: <true|false> # is property nullable?
        Src: <a string describing where the property came from - e.g.
                 a CRF.>


Either the `Type` or the `Enum` key should be present. If Enum key is
present, the `Type` key will be ignored.

`Src` is a note regarding the data source of the property. The value
is not used in any output; it is essentially a comment.

Where properties need to be applied to Nodes and Relationships, use a
list of propnames from those defined in PropDefinitions.

## model-tool Outputs

### Gen3 "Schema YAML"

`model-tool` uses MakeModel to create a set of Gen3 schema YAML files,
one for each defined node. The schema YAML files contain the
appropriate definitions of properties and links as required by the
Gen3 dictionary system, as well as "boilerplate" and default items
that are a nuisance to keep track of manually.

*Note*: Objects (i.e., key-value constructs) in the output schema YAML
documents will appear in the files in a pre-defined default order
(rather than in a sorted order or a random order). The default order
is the one that appears in Gen3 example documents. This order can be
customized in the `ICDC::MakeModel::Config` module (but not very
conveniently at the moment).

### Gen3 "Dictionary JSON"

`model-tool` will create a  JSON document containing all node schema
definitions in a single JSON object. This is required by the Gen3
system for configuration.

#### Including Gen3 configuration YAMLs

MakeModel has a feature to include "native" YAML files verbatim in the
production of the dictionary JSON file. *Note*: this feature allows
the verbatim inclusion of Gen3 model configuration files such as
"\_settings.yaml", "\_definitions.yaml", and "\_terms.yaml". It will
not add Gen3-defined node, properties or links to the model
(currently).

### Graphic representation of the input model

`model-tool` can produce an SVG rendering of the input data
model. This requires that [GraphViz](http://www.graphviz.org/) be
installed on your system.
<div id='graph' style='display:off;'>
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 2.40.1 (20161225.0304)
 -->
<!-- Title: Perl Pages: 1 -->
<svg width="3238pt" height="2966pt"
 viewBox="0.00 0.00 3238.34 2966.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(4 2962)">
<title>Perl</title>
<polygon fill="#ffffff" stroke="transparent" points="-4,4 -4,-2962 3234.3385,-2962 3234.3385,4 -4,4"/>
<!-- disease_extent -->
<g id="node1" class="node">
<title>disease_extent</title>
<path fill="none" stroke="#000000" d="M955.5,-1877C955.5,-1877 1271.5,-1877 1271.5,-1877 1277.5,-1877 1283.5,-1883 1283.5,-1889 1283.5,-1889 1283.5,-2164 1283.5,-2164 1283.5,-2170 1277.5,-2176 1271.5,-2176 1271.5,-2176 955.5,-2176 955.5,-2176 949.5,-2176 943.5,-2170 943.5,-2164 943.5,-2164 943.5,-1889 943.5,-1889 943.5,-1883 949.5,-1877 955.5,-1877"/>
<text text-anchor="middle" x="1005" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">disease_extent</text>
<polyline fill="none" stroke="#000000" points="1066.5,-1877 1066.5,-2176 "/>
<text text-anchor="middle" x="1077" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1087.5,-1877 1087.5,-2176 "/>
<text text-anchor="middle" x="1175" y="-2160.8" font-family="Times,serif" font-size="14.00" fill="#000000">evaluation_number</text>
<polyline fill="none" stroke="#000000" points="1087.5,-2153 1262.5,-2153 "/>
<text text-anchor="middle" x="1175" y="-2137.8" font-family="Times,serif" font-size="14.00" fill="#000000">lesion_number</text>
<polyline fill="none" stroke="#000000" points="1087.5,-2130 1262.5,-2130 "/>
<text text-anchor="middle" x="1175" y="-2114.8" font-family="Times,serif" font-size="14.00" fill="#000000">target_lesion</text>
<polyline fill="none" stroke="#000000" points="1087.5,-2107 1262.5,-2107 "/>
<text text-anchor="middle" x="1175" y="-2091.8" font-family="Times,serif" font-size="14.00" fill="#000000">longest_measurement</text>
<polyline fill="none" stroke="#000000" points="1087.5,-2084 1262.5,-2084 "/>
<text text-anchor="middle" x="1175" y="-2068.8" font-family="Times,serif" font-size="14.00" fill="#000000">lesion_site</text>
<polyline fill="none" stroke="#000000" points="1087.5,-2061 1262.5,-2061 "/>
<text text-anchor="middle" x="1175" y="-2045.8" font-family="Times,serif" font-size="14.00" fill="#000000">previously_irradiated</text>
<polyline fill="none" stroke="#000000" points="1087.5,-2038 1262.5,-2038 "/>
<text text-anchor="middle" x="1175" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">lesion_description</text>
<polyline fill="none" stroke="#000000" points="1087.5,-2015 1262.5,-2015 "/>
<text text-anchor="middle" x="1175" y="-1999.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_evaluation</text>
<polyline fill="none" stroke="#000000" points="1087.5,-1992 1262.5,-1992 "/>
<text text-anchor="middle" x="1175" y="-1976.8" font-family="Times,serif" font-size="14.00" fill="#000000">measured_how</text>
<polyline fill="none" stroke="#000000" points="1087.5,-1969 1262.5,-1969 "/>
<text text-anchor="middle" x="1175" y="-1953.8" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="1087.5,-1946 1262.5,-1946 "/>
<text text-anchor="middle" x="1175" y="-1930.8" font-family="Times,serif" font-size="14.00" fill="#000000">previously_treated</text>
<polyline fill="none" stroke="#000000" points="1087.5,-1923 1262.5,-1923 "/>
<text text-anchor="middle" x="1175" y="-1907.8" font-family="Times,serif" font-size="14.00" fill="#000000">evaluation_code</text>
<polyline fill="none" stroke="#000000" points="1087.5,-1900 1262.5,-1900 "/>
<text text-anchor="middle" x="1175" y="-1884.8" font-family="Times,serif" font-size="14.00" fill="#000000">measurable_lesion</text>
<polyline fill="none" stroke="#000000" points="1262.5,-1877 1262.5,-2176 "/>
<text text-anchor="middle" x="1273" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- visit -->
<g id="node12" class="node">
<title>visit</title>
<path fill="none" stroke="#000000" d="M1026,-1549C1026,-1549 1201,-1549 1201,-1549 1207,-1549 1213,-1555 1213,-1561 1213,-1561 1213,-1583 1213,-1583 1213,-1589 1207,-1595 1201,-1595 1201,-1595 1026,-1595 1026,-1595 1020,-1595 1014,-1589 1014,-1583 1014,-1583 1014,-1561 1014,-1561 1014,-1555 1020,-1549 1026,-1549"/>
<text text-anchor="middle" x="1037.5" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000">visit</text>
<polyline fill="none" stroke="#000000" points="1061,-1549 1061,-1595 "/>
<text text-anchor="middle" x="1071.5" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1082,-1549 1082,-1595 "/>
<text text-anchor="middle" x="1137" y="-1579.8" font-family="Times,serif" font-size="14.00" fill="#000000">visit_number</text>
<polyline fill="none" stroke="#000000" points="1082,-1572 1192,-1572 "/>
<text text-anchor="middle" x="1137" y="-1556.8" font-family="Times,serif" font-size="14.00" fill="#000000">visit_date</text>
<polyline fill="none" stroke="#000000" points="1192,-1549 1192,-1595 "/>
<text text-anchor="middle" x="1202.5" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- disease_extent&#45;&gt;visit -->
<g id="edge17" class="edge">
<title>disease_extent&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M1113.5,-1876.7352C1113.5,-1780.0262 1113.5,-1662.049 1113.5,-1605.4425"/>
<polygon fill="#000000" stroke="#000000" points="1117.0001,-1605.2846 1113.5,-1595.2846 1110.0001,-1605.2847 1117.0001,-1605.2846"/>
<text text-anchor="middle" x="1141.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- off_treatment -->
<g id="node2" class="node">
<title>off_treatment</title>
<path fill="none" stroke="#000000" d="M1978,-726C1978,-726 2425,-726 2425,-726 2431,-726 2437,-732 2437,-738 2437,-738 2437,-898 2437,-898 2437,-904 2431,-910 2425,-910 2425,-910 1978,-910 1978,-910 1972,-910 1966,-904 1966,-898 1966,-898 1966,-738 1966,-738 1966,-732 1972,-726 1978,-726"/>
<text text-anchor="middle" x="2023.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">off_treatment</text>
<polyline fill="none" stroke="#000000" points="2081,-726 2081,-910 "/>
<text text-anchor="middle" x="2091.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2102,-726 2102,-910 "/>
<text text-anchor="middle" x="2259" y="-894.8" font-family="Times,serif" font-size="14.00" fill="#000000">best_resp_vet_tx_tp_secondary_response</text>
<polyline fill="none" stroke="#000000" points="2102,-887 2416,-887 "/>
<text text-anchor="middle" x="2259" y="-871.8" font-family="Times,serif" font-size="14.00" fill="#000000">best_resp_vet_tx_tp_best_response</text>
<polyline fill="none" stroke="#000000" points="2102,-864 2416,-864 "/>
<text text-anchor="middle" x="2259" y="-848.8" font-family="Times,serif" font-size="14.00" fill="#000000">reason_off_treatment</text>
<polyline fill="none" stroke="#000000" points="2102,-841 2416,-841 "/>
<text text-anchor="middle" x="2259" y="-825.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_off_treatment</text>
<polyline fill="none" stroke="#000000" points="2102,-818 2416,-818 "/>
<text text-anchor="middle" x="2259" y="-802.8" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="2102,-795 2416,-795 "/>
<text text-anchor="middle" x="2259" y="-779.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_disease_progression</text>
<polyline fill="none" stroke="#000000" points="2102,-772 2416,-772 "/>
<text text-anchor="middle" x="2259" y="-756.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_best_response</text>
<polyline fill="none" stroke="#000000" points="2102,-749 2416,-749 "/>
<text text-anchor="middle" x="2259" y="-733.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_last_medication_administration</text>
<polyline fill="none" stroke="#000000" points="2416,-726 2416,-910 "/>
<text text-anchor="middle" x="2426.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- diagnosis -->
<g id="node3" class="node">
<title>diagnosis</title>
<path fill="none" stroke="#000000" d="M2517,-2344.5C2517,-2344.5 2860,-2344.5 2860,-2344.5 2866,-2344.5 2872,-2350.5 2872,-2356.5 2872,-2356.5 2872,-2631.5 2872,-2631.5 2872,-2637.5 2866,-2643.5 2860,-2643.5 2860,-2643.5 2517,-2643.5 2517,-2643.5 2511,-2643.5 2505,-2637.5 2505,-2631.5 2505,-2631.5 2505,-2356.5 2505,-2356.5 2505,-2350.5 2511,-2344.5 2517,-2344.5"/>
<text text-anchor="middle" x="2547" y="-2490.3" font-family="Times,serif" font-size="14.00" fill="#000000">diagnosis</text>
<polyline fill="none" stroke="#000000" points="2589,-2344.5 2589,-2643.5 "/>
<text text-anchor="middle" x="2599.5" y="-2490.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2610,-2344.5 2610,-2643.5 "/>
<text text-anchor="middle" x="2730.5" y="-2628.3" font-family="Times,serif" font-size="14.00" fill="#000000">histological_grade</text>
<polyline fill="none" stroke="#000000" points="2610,-2620.5 2851,-2620.5 "/>
<text text-anchor="middle" x="2730.5" y="-2605.3" font-family="Times,serif" font-size="14.00" fill="#000000">concurrent_disease_type</text>
<polyline fill="none" stroke="#000000" points="2610,-2597.5 2851,-2597.5 "/>
<text text-anchor="middle" x="2730.5" y="-2582.3" font-family="Times,serif" font-size="14.00" fill="#000000">stage_of_disease</text>
<polyline fill="none" stroke="#000000" points="2610,-2574.5 2851,-2574.5 "/>
<text text-anchor="middle" x="2730.5" y="-2559.3" font-family="Times,serif" font-size="14.00" fill="#000000">primary_disease_site</text>
<polyline fill="none" stroke="#000000" points="2610,-2551.5 2851,-2551.5 "/>
<text text-anchor="middle" x="2730.5" y="-2536.3" font-family="Times,serif" font-size="14.00" fill="#000000">disease_term</text>
<polyline fill="none" stroke="#000000" points="2610,-2528.5 2851,-2528.5 "/>
<text text-anchor="middle" x="2730.5" y="-2513.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="2610,-2505.5 2851,-2505.5 "/>
<text text-anchor="middle" x="2730.5" y="-2490.3" font-family="Times,serif" font-size="14.00" fill="#000000">concurrent_disease</text>
<polyline fill="none" stroke="#000000" points="2610,-2482.5 2851,-2482.5 "/>
<text text-anchor="middle" x="2730.5" y="-2467.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_histology_confirmation</text>
<polyline fill="none" stroke="#000000" points="2610,-2459.5 2851,-2459.5 "/>
<text text-anchor="middle" x="2730.5" y="-2444.3" font-family="Times,serif" font-size="14.00" fill="#000000">pathology_report</text>
<polyline fill="none" stroke="#000000" points="2610,-2436.5 2851,-2436.5 "/>
<text text-anchor="middle" x="2730.5" y="-2421.3" font-family="Times,serif" font-size="14.00" fill="#000000">follow_up_data</text>
<polyline fill="none" stroke="#000000" points="2610,-2413.5 2851,-2413.5 "/>
<text text-anchor="middle" x="2730.5" y="-2398.3" font-family="Times,serif" font-size="14.00" fill="#000000">treatment_data</text>
<polyline fill="none" stroke="#000000" points="2610,-2390.5 2851,-2390.5 "/>
<text text-anchor="middle" x="2730.5" y="-2375.3" font-family="Times,serif" font-size="14.00" fill="#000000">histology_cytopathology</text>
<polyline fill="none" stroke="#000000" points="2610,-2367.5 2851,-2367.5 "/>
<text text-anchor="middle" x="2730.5" y="-2352.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_diagnosis</text>
<polyline fill="none" stroke="#000000" points="2851,-2344.5 2851,-2643.5 "/>
<text text-anchor="middle" x="2861.5" y="-2490.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- case -->
<g id="node22" class="node">
<title>case</title>
<path fill="none" stroke="#000000" d="M1774,-1065.5C1774,-1065.5 1993,-1065.5 1993,-1065.5 1999,-1065.5 2005,-1071.5 2005,-1077.5 2005,-1077.5 2005,-1145.5 2005,-1145.5 2005,-1151.5 1999,-1157.5 1993,-1157.5 1993,-1157.5 1774,-1157.5 1774,-1157.5 1768,-1157.5 1762,-1151.5 1762,-1145.5 1762,-1145.5 1762,-1077.5 1762,-1077.5 1762,-1071.5 1768,-1065.5 1774,-1065.5"/>
<text text-anchor="middle" x="1786.5" y="-1107.8" font-family="Times,serif" font-size="14.00" fill="#000000">case</text>
<polyline fill="none" stroke="#000000" points="1811,-1065.5 1811,-1157.5 "/>
<text text-anchor="middle" x="1821.5" y="-1107.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1832,-1065.5 1832,-1157.5 "/>
<text text-anchor="middle" x="1908" y="-1142.3" font-family="Times,serif" font-size="14.00" fill="#000000">patient_first_name</text>
<polyline fill="none" stroke="#000000" points="1832,-1134.5 1984,-1134.5 "/>
<text text-anchor="middle" x="1908" y="-1119.3" font-family="Times,serif" font-size="14.00" fill="#000000">case_id</text>
<polyline fill="none" stroke="#000000" points="1832,-1111.5 1984,-1111.5 "/>
<text text-anchor="middle" x="1908" y="-1096.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="1832,-1088.5 1984,-1088.5 "/>
<text text-anchor="middle" x="1908" y="-1073.3" font-family="Times,serif" font-size="14.00" fill="#000000">patient_id</text>
<polyline fill="none" stroke="#000000" points="1984,-1065.5 1984,-1157.5 "/>
<text text-anchor="middle" x="1994.5" y="-1107.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- diagnosis&#45;&gt;case -->
<g id="edge33" class="edge">
<title>diagnosis&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M2872.1968,-2450.0816C2986.4143,-2418.7071 3117.9149,-2373.7433 3152.5,-2326 3315.4026,-2101.1197 3171.5,-1979.184 3171.5,-1701.5 3171.5,-1701.5 3171.5,-1701.5 3171.5,-1313 3171.5,-1196.8647 2343.5648,-1137.4273 2015.2924,-1118.425"/>
<polygon fill="#000000" stroke="#000000" points="2015.4365,-1114.9276 2005.2519,-1117.8475 2015.0344,-1121.9161 2015.4365,-1114.9276"/>
<text text-anchor="middle" x="3198.5" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- study_site -->
<g id="node4" class="node">
<title>study_site</title>
<path fill="none" stroke="#000000" d="M2506,-403.5C2506,-403.5 2823,-403.5 2823,-403.5 2829,-403.5 2835,-409.5 2835,-415.5 2835,-415.5 2835,-460.5 2835,-460.5 2835,-466.5 2829,-472.5 2823,-472.5 2823,-472.5 2506,-472.5 2506,-472.5 2500,-472.5 2494,-466.5 2494,-460.5 2494,-460.5 2494,-415.5 2494,-415.5 2494,-409.5 2500,-403.5 2506,-403.5"/>
<text text-anchor="middle" x="2539" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">study_site</text>
<polyline fill="none" stroke="#000000" points="2584,-403.5 2584,-472.5 "/>
<text text-anchor="middle" x="2594.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2605,-403.5 2605,-472.5 "/>
<text text-anchor="middle" x="2709.5" y="-457.3" font-family="Times,serif" font-size="14.00" fill="#000000">site_short_name</text>
<polyline fill="none" stroke="#000000" points="2605,-449.5 2814,-449.5 "/>
<text text-anchor="middle" x="2709.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">veterinary_medical_center</text>
<polyline fill="none" stroke="#000000" points="2605,-426.5 2814,-426.5 "/>
<text text-anchor="middle" x="2709.5" y="-411.3" font-family="Times,serif" font-size="14.00" fill="#000000">registering_institution</text>
<polyline fill="none" stroke="#000000" points="2814,-403.5 2814,-472.5 "/>
<text text-anchor="middle" x="2824.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- study -->
<g id="node21" class="node">
<title>study</title>
<path fill="none" stroke="#000000" d="M2325.5,-190.5C2325.5,-190.5 2605.5,-190.5 2605.5,-190.5 2611.5,-190.5 2617.5,-196.5 2617.5,-202.5 2617.5,-202.5 2617.5,-339.5 2617.5,-339.5 2617.5,-345.5 2611.5,-351.5 2605.5,-351.5 2605.5,-351.5 2325.5,-351.5 2325.5,-351.5 2319.5,-351.5 2313.5,-345.5 2313.5,-339.5 2313.5,-339.5 2313.5,-202.5 2313.5,-202.5 2313.5,-196.5 2319.5,-190.5 2325.5,-190.5"/>
<text text-anchor="middle" x="2341.5" y="-267.3" font-family="Times,serif" font-size="14.00" fill="#000000">study</text>
<polyline fill="none" stroke="#000000" points="2369.5,-190.5 2369.5,-351.5 "/>
<text text-anchor="middle" x="2380" y="-267.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2390.5,-190.5 2390.5,-351.5 "/>
<text text-anchor="middle" x="2493.5" y="-336.3" font-family="Times,serif" font-size="14.00" fill="#000000">dates_of_conduct</text>
<polyline fill="none" stroke="#000000" points="2390.5,-328.5 2596.5,-328.5 "/>
<text text-anchor="middle" x="2493.5" y="-313.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_iacuc_approval</text>
<polyline fill="none" stroke="#000000" points="2390.5,-305.5 2596.5,-305.5 "/>
<text text-anchor="middle" x="2493.5" y="-290.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_designation</text>
<polyline fill="none" stroke="#000000" points="2390.5,-282.5 2596.5,-282.5 "/>
<text text-anchor="middle" x="2493.5" y="-267.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_name</text>
<polyline fill="none" stroke="#000000" points="2390.5,-259.5 2596.5,-259.5 "/>
<text text-anchor="middle" x="2493.5" y="-244.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_description</text>
<polyline fill="none" stroke="#000000" points="2390.5,-236.5 2596.5,-236.5 "/>
<text text-anchor="middle" x="2493.5" y="-221.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_type</text>
<polyline fill="none" stroke="#000000" points="2390.5,-213.5 2596.5,-213.5 "/>
<text text-anchor="middle" x="2493.5" y="-198.3" font-family="Times,serif" font-size="14.00" fill="#000000">clinical_study_id</text>
<polyline fill="none" stroke="#000000" points="2596.5,-190.5 2596.5,-351.5 "/>
<text text-anchor="middle" x="2607" y="-267.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- study_site&#45;&gt;study -->
<g id="edge2" class="edge">
<title>study_site&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M2623.2671,-403.3975C2607.4578,-390.1304 2588.6185,-374.3205 2569.5557,-358.3231"/>
<polygon fill="#000000" stroke="#000000" points="2571.5811,-355.4537 2561.671,-351.7063 2567.0812,-360.8157 2571.5811,-355.4537"/>
<text text-anchor="middle" x="2630" y="-373.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_study</text>
</g>
<!-- lab_exam -->
<g id="node5" class="node">
<title>lab_exam</title>
<path fill="none" stroke="#000000" d="M523.5,-2008.5C523.5,-2008.5 583.5,-2008.5 583.5,-2008.5 589.5,-2008.5 595.5,-2014.5 595.5,-2020.5 595.5,-2020.5 595.5,-2032.5 595.5,-2032.5 595.5,-2038.5 589.5,-2044.5 583.5,-2044.5 583.5,-2044.5 523.5,-2044.5 523.5,-2044.5 517.5,-2044.5 511.5,-2038.5 511.5,-2032.5 511.5,-2032.5 511.5,-2020.5 511.5,-2020.5 511.5,-2014.5 517.5,-2008.5 523.5,-2008.5"/>
<text text-anchor="middle" x="553.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">lab_exam</text>
</g>
<!-- lab_exam&#45;&gt;visit -->
<g id="edge15" class="edge">
<title>lab_exam&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M550.6595,-2008.2877C543.7584,-1957.0022 531.6513,-1809.7362 604.5,-1727 657.2798,-1667.0565 870.9987,-1617.372 1004.1528,-1591.4376"/>
<polygon fill="#000000" stroke="#000000" points="1004.8401,-1594.8696 1013.9942,-1589.5354 1003.5116,-1587.9968 1004.8401,-1594.8696"/>
<text text-anchor="middle" x="675.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- cohort -->
<g id="node6" class="node">
<title>cohort</title>
<path fill="none" stroke="#000000" d="M1799,-524.5C1799,-524.5 2032,-524.5 2032,-524.5 2038,-524.5 2044,-530.5 2044,-536.5 2044,-536.5 2044,-558.5 2044,-558.5 2044,-564.5 2038,-570.5 2032,-570.5 2032,-570.5 1799,-570.5 1799,-570.5 1793,-570.5 1787,-564.5 1787,-558.5 1787,-558.5 1787,-536.5 1787,-536.5 1787,-530.5 1793,-524.5 1799,-524.5"/>
<text text-anchor="middle" x="1818.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000">cohort</text>
<polyline fill="none" stroke="#000000" points="1850,-524.5 1850,-570.5 "/>
<text text-anchor="middle" x="1860.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1871,-524.5 1871,-570.5 "/>
<text text-anchor="middle" x="1947" y="-555.3" font-family="Times,serif" font-size="14.00" fill="#000000">cohort_dose</text>
<polyline fill="none" stroke="#000000" points="1871,-547.5 2023,-547.5 "/>
<text text-anchor="middle" x="1947" y="-532.3" font-family="Times,serif" font-size="14.00" fill="#000000">cohort_description</text>
<polyline fill="none" stroke="#000000" points="2023,-524.5 2023,-570.5 "/>
<text text-anchor="middle" x="2033.5" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- study_arm -->
<g id="node9" class="node">
<title>study_arm</title>
<path fill="none" stroke="#000000" d="M1731,-415C1731,-415 2100,-415 2100,-415 2106,-415 2112,-421 2112,-427 2112,-427 2112,-449 2112,-449 2112,-455 2106,-461 2100,-461 2100,-461 1731,-461 1731,-461 1725,-461 1719,-455 1719,-449 1719,-449 1719,-427 1719,-427 1719,-421 1725,-415 1731,-415"/>
<text text-anchor="middle" x="1765" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">study_arm</text>
<polyline fill="none" stroke="#000000" points="1811,-415 1811,-461 "/>
<text text-anchor="middle" x="1821.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1832,-415 1832,-461 "/>
<text text-anchor="middle" x="1961.5" y="-445.8" font-family="Times,serif" font-size="14.00" fill="#000000">ctep_treatment_assignment_code</text>
<polyline fill="none" stroke="#000000" points="1832,-438 2091,-438 "/>
<text text-anchor="middle" x="1961.5" y="-422.8" font-family="Times,serif" font-size="14.00" fill="#000000">arm</text>
<polyline fill="none" stroke="#000000" points="2091,-415 2091,-461 "/>
<text text-anchor="middle" x="2101.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- cohort&#45;&gt;study_arm -->
<g id="edge5" class="edge">
<title>cohort&#45;&gt;study_arm</title>
<path fill="none" stroke="#000000" d="M1915.5,-524.2779C1915.5,-508.8892 1915.5,-488.4597 1915.5,-471.3432"/>
<polygon fill="#000000" stroke="#000000" points="1919.0001,-471.1886 1915.5,-461.1887 1912.0001,-471.1887 1919.0001,-471.1886"/>
<text text-anchor="middle" x="1956" y="-494.8" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- cohort&#45;&gt;study -->
<g id="edge9" class="edge">
<title>cohort&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M1989.2793,-524.4912C2029.1477,-511.1489 2078.8132,-493.0434 2121.5,-473 2193.3494,-439.2634 2269.8134,-395.2475 2332.3595,-356.9179"/>
<polygon fill="#000000" stroke="#000000" points="2334.4058,-359.7684 2341.0907,-351.5488 2330.739,-353.8056 2334.4058,-359.7684"/>
<text text-anchor="middle" x="2291" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- demographic -->
<g id="node7" class="node">
<title>demographic</title>
<path fill="none" stroke="#000000" d="M1507.5,-1232.5C1507.5,-1232.5 1843.5,-1232.5 1843.5,-1232.5 1849.5,-1232.5 1855.5,-1238.5 1855.5,-1244.5 1855.5,-1244.5 1855.5,-1381.5 1855.5,-1381.5 1855.5,-1387.5 1849.5,-1393.5 1843.5,-1393.5 1843.5,-1393.5 1507.5,-1393.5 1507.5,-1393.5 1501.5,-1393.5 1495.5,-1387.5 1495.5,-1381.5 1495.5,-1381.5 1495.5,-1244.5 1495.5,-1244.5 1495.5,-1238.5 1501.5,-1232.5 1507.5,-1232.5"/>
<text text-anchor="middle" x="1550.5" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000">demographic</text>
<polyline fill="none" stroke="#000000" points="1605.5,-1232.5 1605.5,-1393.5 "/>
<text text-anchor="middle" x="1616" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1626.5,-1232.5 1626.5,-1393.5 "/>
<text text-anchor="middle" x="1730.5" y="-1378.3" font-family="Times,serif" font-size="14.00" fill="#000000">weight</text>
<polyline fill="none" stroke="#000000" points="1626.5,-1370.5 1834.5,-1370.5 "/>
<text text-anchor="middle" x="1730.5" y="-1355.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="1626.5,-1347.5 1834.5,-1347.5 "/>
<text text-anchor="middle" x="1730.5" y="-1332.3" font-family="Times,serif" font-size="14.00" fill="#000000">sex</text>
<polyline fill="none" stroke="#000000" points="1626.5,-1324.5 1834.5,-1324.5 "/>
<text text-anchor="middle" x="1730.5" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000">neutered_indicator</text>
<polyline fill="none" stroke="#000000" points="1626.5,-1301.5 1834.5,-1301.5 "/>
<text text-anchor="middle" x="1730.5" y="-1286.3" font-family="Times,serif" font-size="14.00" fill="#000000">breed</text>
<polyline fill="none" stroke="#000000" points="1626.5,-1278.5 1834.5,-1278.5 "/>
<text text-anchor="middle" x="1730.5" y="-1263.3" font-family="Times,serif" font-size="14.00" fill="#000000">patient_age_at_enrollment</text>
<polyline fill="none" stroke="#000000" points="1626.5,-1255.5 1834.5,-1255.5 "/>
<text text-anchor="middle" x="1730.5" y="-1240.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_birth</text>
<polyline fill="none" stroke="#000000" points="1834.5,-1232.5 1834.5,-1393.5 "/>
<text text-anchor="middle" x="1845" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- demographic&#45;&gt;case -->
<g id="edge32" class="edge">
<title>demographic&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M1757.4636,-1232.3742C1776.4634,-1213.801 1796.6426,-1194.1679 1815.5,-1176 1819.3816,-1172.2603 1823.3972,-1168.4085 1827.4471,-1164.5362"/>
<polygon fill="#000000" stroke="#000000" points="1829.935,-1167 1834.7525,-1157.5638 1825.102,-1161.9362 1829.935,-1167"/>
<text text-anchor="middle" x="1842.5" y="-1179.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- prior_therapy -->
<g id="node8" class="node">
<title>prior_therapy</title>
<path fill="none" stroke="#000000" d="M2625.5,-1727.5C2625.5,-1727.5 3081.5,-1727.5 3081.5,-1727.5 3087.5,-1727.5 3093.5,-1733.5 3093.5,-1739.5 3093.5,-1739.5 3093.5,-2313.5 3093.5,-2313.5 3093.5,-2319.5 3087.5,-2325.5 3081.5,-2325.5 3081.5,-2325.5 2625.5,-2325.5 2625.5,-2325.5 2619.5,-2325.5 2613.5,-2319.5 2613.5,-2313.5 2613.5,-2313.5 2613.5,-1739.5 2613.5,-1739.5 2613.5,-1733.5 2619.5,-1727.5 2625.5,-1727.5"/>
<text text-anchor="middle" x="2671" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">prior_therapy</text>
<polyline fill="none" stroke="#000000" points="2728.5,-1727.5 2728.5,-2325.5 "/>
<text text-anchor="middle" x="2739" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2749.5,-1727.5 2749.5,-2325.5 "/>
<text text-anchor="middle" x="2911" y="-2310.3" font-family="Times,serif" font-size="14.00" fill="#000000">nonresponse_therapy_type</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2302.5 3072.5,-2302.5 "/>
<text text-anchor="middle" x="2911" y="-2287.3" font-family="Times,serif" font-size="14.00" fill="#000000">min_rsdl_dz_tx_ind_nsaids_treatment_pe</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2279.5 3072.5,-2279.5 "/>
<text text-anchor="middle" x="2911" y="-2264.3" font-family="Times,serif" font-size="14.00" fill="#000000">prior_steroid_exposure</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2256.5 3072.5,-2256.5 "/>
<text text-anchor="middle" x="2911" y="-2241.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_number_of_doses_any_therapy</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2233.5 3072.5,-2233.5 "/>
<text text-anchor="middle" x="2911" y="-2218.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_dose</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2210.5 3072.5,-2210.5 "/>
<text text-anchor="middle" x="2911" y="-2195.3" font-family="Times,serif" font-size="14.00" fill="#000000">any_therapy</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2187.5 3072.5,-2187.5 "/>
<text text-anchor="middle" x="2911" y="-2172.3" font-family="Times,serif" font-size="14.00" fill="#000000">number_of_prior_regimens_nsaid</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2164.5 3072.5,-2164.5 "/>
<text text-anchor="middle" x="2911" y="-2149.3" font-family="Times,serif" font-size="14.00" fill="#000000">treatment_performed_at_site</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2141.5 3072.5,-2141.5 "/>
<text text-anchor="middle" x="2911" y="-2126.3" font-family="Times,serif" font-size="14.00" fill="#000000">therapy_type</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2118.5 3072.5,-2118.5 "/>
<text text-anchor="middle" x="2911" y="-2103.3" font-family="Times,serif" font-size="14.00" fill="#000000">best_response</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2095.5 3072.5,-2095.5 "/>
<text text-anchor="middle" x="2911" y="-2080.3" font-family="Times,serif" font-size="14.00" fill="#000000">prior_therapy_type</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2072.5 3072.5,-2072.5 "/>
<text text-anchor="middle" x="2911" y="-2057.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_dose_steroid</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2049.5 3072.5,-2049.5 "/>
<text text-anchor="middle" x="2911" y="-2034.3" font-family="Times,serif" font-size="14.00" fill="#000000">treatment_performed_in_minimal_residual</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2026.5 3072.5,-2026.5 "/>
<text text-anchor="middle" x="2911" y="-2011.3" font-family="Times,serif" font-size="14.00" fill="#000000">tx_loc_geo_loc_ind_nsaid</text>
<polyline fill="none" stroke="#000000" points="2749.5,-2003.5 3072.5,-2003.5 "/>
<text text-anchor="middle" x="2911" y="-1988.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_dose</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1980.5 3072.5,-1980.5 "/>
<text text-anchor="middle" x="2911" y="-1965.3" font-family="Times,serif" font-size="14.00" fill="#000000">agent_name</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1957.5 3072.5,-1957.5 "/>
<text text-anchor="middle" x="2911" y="-1942.3" font-family="Times,serif" font-size="14.00" fill="#000000">number_of_prior_regimens_any_therapy</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1934.5 3072.5,-1934.5 "/>
<text text-anchor="middle" x="2911" y="-1919.3" font-family="Times,serif" font-size="14.00" fill="#000000">agent_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1911.5 3072.5,-1911.5 "/>
<text text-anchor="middle" x="2911" y="-1896.3" font-family="Times,serif" font-size="14.00" fill="#000000">number_of_prior_regimens_steroid</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1888.5 3072.5,-1888.5 "/>
<text text-anchor="middle" x="2911" y="-1873.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_number_of_doses_steroid</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1865.5 3072.5,-1865.5 "/>
<text text-anchor="middle" x="2911" y="-1850.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_number_of_doses_nsaid</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1842.5 3072.5,-1842.5 "/>
<text text-anchor="middle" x="2911" y="-1827.3" font-family="Times,serif" font-size="14.00" fill="#000000">dose_schedule</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1819.5 3072.5,-1819.5 "/>
<text text-anchor="middle" x="2911" y="-1804.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_dose_any_therapy</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1796.5 3072.5,-1796.5 "/>
<text text-anchor="middle" x="2911" y="-1781.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_first_dose</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1773.5 3072.5,-1773.5 "/>
<text text-anchor="middle" x="2911" y="-1758.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_dose_nsaid</text>
<polyline fill="none" stroke="#000000" points="2749.5,-1750.5 3072.5,-1750.5 "/>
<text text-anchor="middle" x="2911" y="-1735.3" font-family="Times,serif" font-size="14.00" fill="#000000">prior_nsaid_exposure</text>
<polyline fill="none" stroke="#000000" points="3072.5,-1727.5 3072.5,-2325.5 "/>
<text text-anchor="middle" x="3083" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- prior_therapy&#45;&gt;prior_therapy -->
<g id="edge39" class="edge">
<title>prior_therapy&#45;&gt;prior_therapy</title>
<path fill="none" stroke="#000000" d="M3093.7384,-2064.6912C3104.9387,-2055.0507 3111.5,-2042.3203 3111.5,-2026.5 3111.5,-2014.3876 3107.6539,-2004.0864 3100.8244,-1995.5965"/>
<polygon fill="#000000" stroke="#000000" points="3103.219,-1993.0385 3093.7384,-1988.3088 3098.2002,-1997.9183 3103.219,-1993.0385"/>
<text text-anchor="middle" x="3127.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- enrollment -->
<g id="node18" class="node">
<title>enrollment</title>
<path fill="none" stroke="#000000" d="M2171,-1468.5C2171,-1468.5 2520,-1468.5 2520,-1468.5 2526,-1468.5 2532,-1474.5 2532,-1480.5 2532,-1480.5 2532,-1663.5 2532,-1663.5 2532,-1669.5 2526,-1675.5 2520,-1675.5 2520,-1675.5 2171,-1675.5 2171,-1675.5 2165,-1675.5 2159,-1669.5 2159,-1663.5 2159,-1663.5 2159,-1480.5 2159,-1480.5 2159,-1474.5 2165,-1468.5 2171,-1468.5"/>
<text text-anchor="middle" x="2206.5" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000">enrollment</text>
<polyline fill="none" stroke="#000000" points="2254,-1468.5 2254,-1675.5 "/>
<text text-anchor="middle" x="2264.5" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2275,-1468.5 2275,-1675.5 "/>
<text text-anchor="middle" x="2393" y="-1660.3" font-family="Times,serif" font-size="14.00" fill="#000000">patient_subgroup</text>
<polyline fill="none" stroke="#000000" points="2275,-1652.5 2511,-1652.5 "/>
<text text-anchor="middle" x="2393" y="-1637.3" font-family="Times,serif" font-size="14.00" fill="#000000">site_short_name</text>
<polyline fill="none" stroke="#000000" points="2275,-1629.5 2511,-1629.5 "/>
<text text-anchor="middle" x="2393" y="-1614.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_informed_consent</text>
<polyline fill="none" stroke="#000000" points="2275,-1606.5 2511,-1606.5 "/>
<text text-anchor="middle" x="2393" y="-1591.3" font-family="Times,serif" font-size="14.00" fill="#000000">veterinary_medical_center</text>
<polyline fill="none" stroke="#000000" points="2275,-1583.5 2511,-1583.5 "/>
<text text-anchor="middle" x="2393" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_registration</text>
<polyline fill="none" stroke="#000000" points="2275,-1560.5 2511,-1560.5 "/>
<text text-anchor="middle" x="2393" y="-1545.3" font-family="Times,serif" font-size="14.00" fill="#000000">initials</text>
<polyline fill="none" stroke="#000000" points="2275,-1537.5 2511,-1537.5 "/>
<text text-anchor="middle" x="2393" y="-1522.3" font-family="Times,serif" font-size="14.00" fill="#000000">cohort_description</text>
<polyline fill="none" stroke="#000000" points="2275,-1514.5 2511,-1514.5 "/>
<text text-anchor="middle" x="2393" y="-1499.3" font-family="Times,serif" font-size="14.00" fill="#000000">enrollment_document_number</text>
<polyline fill="none" stroke="#000000" points="2275,-1491.5 2511,-1491.5 "/>
<text text-anchor="middle" x="2393" y="-1476.3" font-family="Times,serif" font-size="14.00" fill="#000000">registering_institution</text>
<polyline fill="none" stroke="#000000" points="2511,-1468.5 2511,-1675.5 "/>
<text text-anchor="middle" x="2521.5" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- prior_therapy&#45;&gt;enrollment -->
<g id="edge21" class="edge">
<title>prior_therapy&#45;&gt;enrollment</title>
<path fill="none" stroke="#000000" d="M2613.3368,-1734.6972C2610.3991,-1732.0959 2607.453,-1729.5292 2604.5,-1727 2584.8251,-1710.1488 2563.091,-1694.0259 2540.8265,-1678.9783"/>
<polygon fill="#000000" stroke="#000000" points="2542.5305,-1675.9076 2532.2706,-1673.2645 2538.643,-1681.7288 2542.5305,-1675.9076"/>
<text text-anchor="middle" x="2628.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">at_enrollment</text>
</g>
<!-- study_arm&#45;&gt;study -->
<g id="edge6" class="edge">
<title>study_arm&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M1991.3977,-414.9547C2071.6263,-390.5944 2200.5845,-351.438 2303.7649,-320.1086"/>
<polygon fill="#000000" stroke="#000000" points="2304.799,-323.4525 2313.3507,-317.198 2302.7652,-316.7545 2304.799,-323.4525"/>
<text text-anchor="middle" x="2165" y="-373.8" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- file -->
<g id="node10" class="node">
<title>file</title>
<path fill="none" stroke="#000000" d="M1915,-2750.5C1915,-2750.5 2100,-2750.5 2100,-2750.5 2106,-2750.5 2112,-2756.5 2112,-2762.5 2112,-2762.5 2112,-2945.5 2112,-2945.5 2112,-2951.5 2106,-2957.5 2100,-2957.5 2100,-2957.5 1915,-2957.5 1915,-2957.5 1909,-2957.5 1903,-2951.5 1903,-2945.5 1903,-2945.5 1903,-2762.5 1903,-2762.5 1903,-2756.5 1909,-2750.5 1915,-2750.5"/>
<text text-anchor="middle" x="1922.5" y="-2850.3" font-family="Times,serif" font-size="14.00" fill="#000000">file</text>
<polyline fill="none" stroke="#000000" points="1942,-2750.5 1942,-2957.5 "/>
<text text-anchor="middle" x="1952.5" y="-2850.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1963,-2750.5 1963,-2957.5 "/>
<text text-anchor="middle" x="2027" y="-2942.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_format</text>
<polyline fill="none" stroke="#000000" points="1963,-2934.5 2091,-2934.5 "/>
<text text-anchor="middle" x="2027" y="-2919.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_status</text>
<polyline fill="none" stroke="#000000" points="1963,-2911.5 2091,-2911.5 "/>
<text text-anchor="middle" x="2027" y="-2896.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_name</text>
<polyline fill="none" stroke="#000000" points="1963,-2888.5 2091,-2888.5 "/>
<text text-anchor="middle" x="2027" y="-2873.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_size</text>
<polyline fill="none" stroke="#000000" points="1963,-2865.5 2091,-2865.5 "/>
<text text-anchor="middle" x="2027" y="-2850.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_locations</text>
<polyline fill="none" stroke="#000000" points="1963,-2842.5 2091,-2842.5 "/>
<text text-anchor="middle" x="2027" y="-2827.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_description</text>
<polyline fill="none" stroke="#000000" points="1963,-2819.5 2091,-2819.5 "/>
<text text-anchor="middle" x="2027" y="-2804.3" font-family="Times,serif" font-size="14.00" fill="#000000">md5sum</text>
<polyline fill="none" stroke="#000000" points="1963,-2796.5 2091,-2796.5 "/>
<text text-anchor="middle" x="2027" y="-2781.3" font-family="Times,serif" font-size="14.00" fill="#000000">file_type</text>
<polyline fill="none" stroke="#000000" points="1963,-2773.5 2091,-2773.5 "/>
<text text-anchor="middle" x="2027" y="-2758.3" font-family="Times,serif" font-size="14.00" fill="#000000">uuid</text>
<polyline fill="none" stroke="#000000" points="2091,-2750.5 2091,-2957.5 "/>
<text text-anchor="middle" x="2101.5" y="-2850.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- file&#45;&gt;diagnosis -->
<g id="edge10" class="edge">
<title>file&#45;&gt;diagnosis</title>
<path fill="none" stroke="#000000" d="M2112.0419,-2798.7355C2213.9923,-2744.8411 2371.4638,-2661.5962 2496.0756,-2595.7222"/>
<polygon fill="#000000" stroke="#000000" points="2497.7846,-2598.7777 2504.9896,-2591.0099 2494.5131,-2592.5892 2497.7846,-2598.7777"/>
<text text-anchor="middle" x="2315" y="-2720.8" font-family="Times,serif" font-size="14.00" fill="#000000">from_diagnosis</text>
</g>
<!-- sample -->
<g id="node15" class="node">
<title>sample</title>
<path fill="none" stroke="#000000" d="M1672,-1819.5C1672,-1819.5 2095,-1819.5 2095,-1819.5 2101,-1819.5 2107,-1825.5 2107,-1831.5 2107,-1831.5 2107,-2221.5 2107,-2221.5 2107,-2227.5 2101,-2233.5 2095,-2233.5 2095,-2233.5 1672,-2233.5 1672,-2233.5 1666,-2233.5 1660,-2227.5 1660,-2221.5 1660,-2221.5 1660,-1831.5 1660,-1831.5 1660,-1825.5 1666,-1819.5 1672,-1819.5"/>
<text text-anchor="middle" x="1694" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">sample</text>
<polyline fill="none" stroke="#000000" points="1728,-1819.5 1728,-2233.5 "/>
<text text-anchor="middle" x="1738.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1749,-1819.5 1749,-2233.5 "/>
<text text-anchor="middle" x="1917.5" y="-2218.3" font-family="Times,serif" font-size="14.00" fill="#000000">sample_type</text>
<polyline fill="none" stroke="#000000" points="1749,-2210.5 2086,-2210.5 "/>
<text text-anchor="middle" x="1917.5" y="-2195.3" font-family="Times,serif" font-size="14.00" fill="#000000">total_tissue_area</text>
<polyline fill="none" stroke="#000000" points="1749,-2187.5 2086,-2187.5 "/>
<text text-anchor="middle" x="1917.5" y="-2172.3" font-family="Times,serif" font-size="14.00" fill="#000000">comment</text>
<polyline fill="none" stroke="#000000" points="1749,-2164.5 2086,-2164.5 "/>
<text text-anchor="middle" x="1917.5" y="-2149.3" font-family="Times,serif" font-size="14.00" fill="#000000">necropsy_sample</text>
<polyline fill="none" stroke="#000000" points="1749,-2141.5 2086,-2141.5 "/>
<text text-anchor="middle" x="1917.5" y="-2126.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_sample_collection</text>
<polyline fill="none" stroke="#000000" points="1749,-2118.5 2086,-2118.5 "/>
<text text-anchor="middle" x="1917.5" y="-2103.3" font-family="Times,serif" font-size="14.00" fill="#000000">length_of_tumor</text>
<polyline fill="none" stroke="#000000" points="1749,-2095.5 2086,-2095.5 "/>
<text text-anchor="middle" x="1917.5" y="-2080.3" font-family="Times,serif" font-size="14.00" fill="#000000">percentage_stroma</text>
<polyline fill="none" stroke="#000000" points="1749,-2072.5 2086,-2072.5 "/>
<text text-anchor="middle" x="1917.5" y="-2057.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area_percentage_pigmented_tumor</text>
<polyline fill="none" stroke="#000000" points="1749,-2049.5 2086,-2049.5 "/>
<text text-anchor="middle" x="1917.5" y="-2034.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area</text>
<polyline fill="none" stroke="#000000" points="1749,-2026.5 2086,-2026.5 "/>
<text text-anchor="middle" x="1917.5" y="-2011.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area_percentage_glass</text>
<polyline fill="none" stroke="#000000" points="1749,-2003.5 2086,-2003.5 "/>
<text text-anchor="middle" x="1917.5" y="-1988.3" font-family="Times,serif" font-size="14.00" fill="#000000">width_of_tumor</text>
<polyline fill="none" stroke="#000000" points="1749,-1980.5 2086,-1980.5 "/>
<text text-anchor="middle" x="1917.5" y="-1965.3" font-family="Times,serif" font-size="14.00" fill="#000000">percentage_tumor</text>
<polyline fill="none" stroke="#000000" points="1749,-1957.5 2086,-1957.5 "/>
<text text-anchor="middle" x="1917.5" y="-1942.3" font-family="Times,serif" font-size="14.00" fill="#000000">tumor_tissue_area</text>
<polyline fill="none" stroke="#000000" points="1749,-1934.5 2086,-1934.5 "/>
<text text-anchor="middle" x="1917.5" y="-1919.3" font-family="Times,serif" font-size="14.00" fill="#000000">non_tumor_tissue_area</text>
<polyline fill="none" stroke="#000000" points="1749,-1911.5 2086,-1911.5 "/>
<text text-anchor="middle" x="1917.5" y="-1896.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area_percentage_tumor</text>
<polyline fill="none" stroke="#000000" points="1749,-1888.5 2086,-1888.5 "/>
<text text-anchor="middle" x="1917.5" y="-1873.3" font-family="Times,serif" font-size="14.00" fill="#000000">sample_id</text>
<polyline fill="none" stroke="#000000" points="1749,-1865.5 2086,-1865.5 "/>
<text text-anchor="middle" x="1917.5" y="-1850.3" font-family="Times,serif" font-size="14.00" fill="#000000">analysis_area_percentage_stroma</text>
<polyline fill="none" stroke="#000000" points="1749,-1842.5 2086,-1842.5 "/>
<text text-anchor="middle" x="1917.5" y="-1827.3" font-family="Times,serif" font-size="14.00" fill="#000000">general_sample_pathology</text>
<polyline fill="none" stroke="#000000" points="2086,-1819.5 2086,-2233.5 "/>
<text text-anchor="middle" x="2096.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- file&#45;&gt;sample -->
<g id="edge29" class="edge">
<title>file&#45;&gt;sample</title>
<path fill="none" stroke="#000000" d="M2002.3956,-2750.3798C1996.2582,-2646.9331 1983.7458,-2483.679 1960.5,-2344 1955.055,-2311.2819 1948.0797,-2276.9443 1940.5574,-2243.4344"/>
<polygon fill="#000000" stroke="#000000" points="1943.9383,-2242.5166 1938.3148,-2233.5373 1937.1114,-2244.0636 1943.9383,-2242.5166"/>
<text text-anchor="middle" x="2035" y="-2676.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_sample</text>
</g>
<!-- assay -->
<g id="node24" class="node">
<title>assay</title>
<path fill="none" stroke="#000000" d="M1867.5,-2662.5C1867.5,-2662.5 1899.5,-2662.5 1899.5,-2662.5 1905.5,-2662.5 1911.5,-2668.5 1911.5,-2674.5 1911.5,-2674.5 1911.5,-2686.5 1911.5,-2686.5 1911.5,-2692.5 1905.5,-2698.5 1899.5,-2698.5 1899.5,-2698.5 1867.5,-2698.5 1867.5,-2698.5 1861.5,-2698.5 1855.5,-2692.5 1855.5,-2686.5 1855.5,-2686.5 1855.5,-2674.5 1855.5,-2674.5 1855.5,-2668.5 1861.5,-2662.5 1867.5,-2662.5"/>
<text text-anchor="middle" x="1883.5" y="-2676.8" font-family="Times,serif" font-size="14.00" fill="#000000">assay</text>
</g>
<!-- file&#45;&gt;assay -->
<g id="edge19" class="edge">
<title>file&#45;&gt;assay</title>
<path fill="none" stroke="#000000" d="M1933.2211,-2750.0694C1921.7656,-2734.041 1910.8927,-2718.8278 1902.2525,-2706.7384"/>
<polygon fill="#000000" stroke="#000000" points="1905.0415,-2704.6213 1896.3793,-2698.5206 1899.3464,-2708.6915 1905.0415,-2704.6213"/>
<text text-anchor="middle" x="1950" y="-2720.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_assay</text>
</g>
<!-- cycle -->
<g id="node11" class="node">
<title>cycle</title>
<path fill="none" stroke="#000000" d="M1195.5,-1278.5C1195.5,-1278.5 1423.5,-1278.5 1423.5,-1278.5 1429.5,-1278.5 1435.5,-1284.5 1435.5,-1290.5 1435.5,-1290.5 1435.5,-1335.5 1435.5,-1335.5 1435.5,-1341.5 1429.5,-1347.5 1423.5,-1347.5 1423.5,-1347.5 1195.5,-1347.5 1195.5,-1347.5 1189.5,-1347.5 1183.5,-1341.5 1183.5,-1335.5 1183.5,-1335.5 1183.5,-1290.5 1183.5,-1290.5 1183.5,-1284.5 1189.5,-1278.5 1195.5,-1278.5"/>
<text text-anchor="middle" x="1210.5" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000">cycle</text>
<polyline fill="none" stroke="#000000" points="1237.5,-1278.5 1237.5,-1347.5 "/>
<text text-anchor="middle" x="1248" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1258.5,-1278.5 1258.5,-1347.5 "/>
<text text-anchor="middle" x="1336.5" y="-1332.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_cycle_start</text>
<polyline fill="none" stroke="#000000" points="1258.5,-1324.5 1414.5,-1324.5 "/>
<text text-anchor="middle" x="1336.5" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_cycle_end</text>
<polyline fill="none" stroke="#000000" points="1258.5,-1301.5 1414.5,-1301.5 "/>
<text text-anchor="middle" x="1336.5" y="-1286.3" font-family="Times,serif" font-size="14.00" fill="#000000">cycle_number</text>
<polyline fill="none" stroke="#000000" points="1414.5,-1278.5 1414.5,-1347.5 "/>
<text text-anchor="middle" x="1425" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- cycle&#45;&gt;case -->
<g id="edge34" class="edge">
<title>cycle&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M1359.3583,-1278.3928C1393.7541,-1255.8765 1441.2649,-1227.3844 1486.5,-1209 1571.9359,-1174.2772 1672.9245,-1149.6837 1751.6649,-1133.8827"/>
<polygon fill="#000000" stroke="#000000" points="1752.5152,-1137.2823 1761.6431,-1131.9034 1751.1531,-1130.4161 1752.5152,-1137.2823"/>
<text text-anchor="middle" x="1597.5" y="-1179.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- visit&#45;&gt;cycle -->
<g id="edge1" class="edge">
<title>visit&#45;&gt;cycle</title>
<path fill="none" stroke="#000000" d="M1131.2394,-1548.5587C1164.2238,-1504.9721 1235.4244,-1410.8856 1277.1715,-1355.7198"/>
<polygon fill="#000000" stroke="#000000" points="1280.1152,-1357.63 1283.3587,-1347.5438 1274.5333,-1353.4058 1280.1152,-1357.63"/>
<text text-anchor="middle" x="1241" y="-1438.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_cycle</text>
</g>
<!-- visit&#45;&gt;visit -->
<g id="edge37" class="edge">
<title>visit&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M1171.5376,-1595.0098C1202.6529,-1598.9199 1231,-1591.25 1231,-1572 1231,-1554.8555 1208.5147,-1546.8964 1181.6145,-1548.1228"/>
<polygon fill="#000000" stroke="#000000" points="1181.2006,-1544.6454 1171.5376,-1548.9902 1181.801,-1551.6196 1181.2006,-1544.6454"/>
<text text-anchor="middle" x="1247" y="-1568.3" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- image -->
<g id="node13" class="node">
<title>image</title>
<path fill="none" stroke="#000000" d="M1829.5,-2836C1829.5,-2836 1865.5,-2836 1865.5,-2836 1871.5,-2836 1877.5,-2842 1877.5,-2848 1877.5,-2848 1877.5,-2860 1877.5,-2860 1877.5,-2866 1871.5,-2872 1865.5,-2872 1865.5,-2872 1829.5,-2872 1829.5,-2872 1823.5,-2872 1817.5,-2866 1817.5,-2860 1817.5,-2860 1817.5,-2848 1817.5,-2848 1817.5,-2842 1823.5,-2836 1829.5,-2836"/>
<text text-anchor="middle" x="1847.5" y="-2850.3" font-family="Times,serif" font-size="14.00" fill="#000000">image</text>
</g>
<!-- image&#45;&gt;assay -->
<g id="edge20" class="edge">
<title>image&#45;&gt;assay</title>
<path fill="none" stroke="#000000" d="M1843.5351,-2835.8839C1838.5063,-2808.8561 1832.2973,-2756.8861 1848.5,-2717 1850.0179,-2713.2635 1852.118,-2709.6927 1854.5425,-2706.3484"/>
<polygon fill="#000000" stroke="#000000" points="1857.3489,-2708.4488 1861.0907,-2698.5367 1851.9843,-2703.9519 1857.3489,-2708.4488"/>
<text text-anchor="middle" x="1879" y="-2720.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_assay</text>
</g>
<!-- adverse_event -->
<g id="node14" class="node">
<title>adverse_event</title>
<path fill="none" stroke="#000000" d="M916,-622.5C916,-622.5 1311,-622.5 1311,-622.5 1317,-622.5 1323,-628.5 1323,-634.5 1323,-634.5 1323,-1001.5 1323,-1001.5 1323,-1007.5 1317,-1013.5 1311,-1013.5 1311,-1013.5 916,-1013.5 916,-1013.5 910,-1013.5 904,-1007.5 904,-1001.5 904,-1001.5 904,-634.5 904,-634.5 904,-628.5 910,-622.5 916,-622.5"/>
<text text-anchor="middle" x="964" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event</text>
<polyline fill="none" stroke="#000000" points="1024,-622.5 1024,-1013.5 "/>
<text text-anchor="middle" x="1034.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1045,-622.5 1045,-1013.5 "/>
<text text-anchor="middle" x="1173.5" y="-998.3" font-family="Times,serif" font-size="14.00" fill="#000000">unexpected_adverse_event</text>
<polyline fill="none" stroke="#000000" points="1045,-990.5 1302,-990.5 "/>
<text text-anchor="middle" x="1173.5" y="-975.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event_term</text>
<polyline fill="none" stroke="#000000" points="1045,-967.5 1302,-967.5 "/>
<text text-anchor="middle" x="1173.5" y="-952.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event_description</text>
<polyline fill="none" stroke="#000000" points="1045,-944.5 1302,-944.5 "/>
<text text-anchor="middle" x="1173.5" y="-929.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event_grade_description</text>
<polyline fill="none" stroke="#000000" points="1045,-921.5 1302,-921.5 "/>
<text text-anchor="middle" x="1173.5" y="-906.3" font-family="Times,serif" font-size="14.00" fill="#000000">dose_limiting_toxicity</text>
<polyline fill="none" stroke="#000000" points="1045,-898.5 1302,-898.5 "/>
<text text-anchor="middle" x="1173.5" y="-883.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_research</text>
<polyline fill="none" stroke="#000000" points="1045,-875.5 1302,-875.5 "/>
<text text-anchor="middle" x="1173.5" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_disease</text>
<polyline fill="none" stroke="#000000" points="1045,-852.5 1302,-852.5 "/>
<text text-anchor="middle" x="1173.5" y="-837.3" font-family="Times,serif" font-size="14.00" fill="#000000">adverse_event_grade</text>
<polyline fill="none" stroke="#000000" points="1045,-829.5 1302,-829.5 "/>
<text text-anchor="middle" x="1173.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_other</text>
<polyline fill="none" stroke="#000000" points="1045,-806.5 1302,-806.5 "/>
<text text-anchor="middle" x="1173.5" y="-791.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_commercial</text>
<polyline fill="none" stroke="#000000" points="1045,-783.5 1302,-783.5 "/>
<text text-anchor="middle" x="1173.5" y="-768.3" font-family="Times,serif" font-size="14.00" fill="#000000">ae_dose</text>
<polyline fill="none" stroke="#000000" points="1045,-760.5 1302,-760.5 "/>
<text text-anchor="middle" x="1173.5" y="-745.3" font-family="Times,serif" font-size="14.00" fill="#000000">day_in_cycle</text>
<polyline fill="none" stroke="#000000" points="1045,-737.5 1302,-737.5 "/>
<text text-anchor="middle" x="1173.5" y="-722.3" font-family="Times,serif" font-size="14.00" fill="#000000">ae_other</text>
<polyline fill="none" stroke="#000000" points="1045,-714.5 1302,-714.5 "/>
<text text-anchor="middle" x="1173.5" y="-699.3" font-family="Times,serif" font-size="14.00" fill="#000000">ae_agent_name</text>
<polyline fill="none" stroke="#000000" points="1045,-691.5 1302,-691.5 "/>
<text text-anchor="middle" x="1173.5" y="-676.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="1045,-668.5 1302,-668.5 "/>
<text text-anchor="middle" x="1173.5" y="-653.3" font-family="Times,serif" font-size="14.00" fill="#000000">attribution_to_ind</text>
<polyline fill="none" stroke="#000000" points="1045,-645.5 1302,-645.5 "/>
<text text-anchor="middle" x="1173.5" y="-630.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_resolved</text>
<polyline fill="none" stroke="#000000" points="1302,-622.5 1302,-1013.5 "/>
<text text-anchor="middle" x="1312.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- adverse_event&#45;&gt;visit -->
<g id="edge16" class="edge">
<title>adverse_event&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M1113.5,-1013.8523C1113.5,-1194.5508 1113.5,-1448.0841 1113.5,-1538.4163"/>
<polygon fill="#000000" stroke="#000000" points="1110.0001,-1538.6074 1113.5,-1548.6075 1117.0001,-1538.6075 1110.0001,-1538.6074"/>
<text text-anchor="middle" x="1141.5" y="-1179.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- adverse_event&#45;&gt;adverse_event -->
<g id="edge41" class="edge">
<title>adverse_event&#45;&gt;adverse_event</title>
<path fill="none" stroke="#000000" d="M1323.2046,-845.2761C1334.376,-838.5862 1341,-829.4941 1341,-818 1341,-809.7386 1337.5781,-802.7181 1331.5052,-796.9385"/>
<polygon fill="#000000" stroke="#000000" points="1333.3073,-793.9155 1323.2046,-790.7239 1329.1119,-799.519 1333.3073,-793.9155"/>
<text text-anchor="middle" x="1357" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- agent -->
<g id="node26" class="node">
<title>agent</title>
<path fill="none" stroke="#000000" d="M1000.5,-524.5C1000.5,-524.5 1226.5,-524.5 1226.5,-524.5 1232.5,-524.5 1238.5,-530.5 1238.5,-536.5 1238.5,-536.5 1238.5,-558.5 1238.5,-558.5 1238.5,-564.5 1232.5,-570.5 1226.5,-570.5 1226.5,-570.5 1000.5,-570.5 1000.5,-570.5 994.5,-570.5 988.5,-564.5 988.5,-558.5 988.5,-558.5 988.5,-536.5 988.5,-536.5 988.5,-530.5 994.5,-524.5 1000.5,-524.5"/>
<text text-anchor="middle" x="1017" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000">agent</text>
<polyline fill="none" stroke="#000000" points="1045.5,-524.5 1045.5,-570.5 "/>
<text text-anchor="middle" x="1056" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1066.5,-524.5 1066.5,-570.5 "/>
<text text-anchor="middle" x="1142" y="-555.3" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="1066.5,-547.5 1217.5,-547.5 "/>
<text text-anchor="middle" x="1142" y="-532.3" font-family="Times,serif" font-size="14.00" fill="#000000">medication</text>
<polyline fill="none" stroke="#000000" points="1217.5,-524.5 1217.5,-570.5 "/>
<text text-anchor="middle" x="1228" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- adverse_event&#45;&gt;agent -->
<g id="edge26" class="edge">
<title>adverse_event&#45;&gt;agent</title>
<path fill="none" stroke="#000000" d="M1113.5,-622.4901C1113.5,-606.8636 1113.5,-592.5861 1113.5,-580.7798"/>
<polygon fill="#000000" stroke="#000000" points="1117.0001,-580.664 1113.5,-570.6641 1110.0001,-580.6641 1117.0001,-580.664"/>
<text text-anchor="middle" x="1144.5" y="-592.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_agent</text>
</g>
<!-- sample&#45;&gt;visit -->
<g id="edge13" class="edge">
<title>sample&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M1750.7678,-1819.4293C1721.168,-1784.7865 1687.4544,-1752.0288 1650.5,-1727 1519.7722,-1638.4595 1338.2835,-1599.8536 1223.3741,-1583.4747"/>
<polygon fill="#000000" stroke="#000000" points="1223.5422,-1579.9644 1213.155,-1582.0517 1222.5767,-1586.8975 1223.5422,-1579.9644"/>
<text text-anchor="middle" x="1639.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- sample&#45;&gt;sample -->
<g id="edge38" class="edge">
<title>sample&#45;&gt;sample</title>
<path fill="none" stroke="#000000" d="M2107.0955,-2065.8333C2118.3572,-2056.0642 2125,-2042.9531 2125,-2026.5 2125,-2013.9031 2121.1061,-2003.2652 2114.2267,-1994.5864"/>
<polygon fill="#000000" stroke="#000000" points="2116.5485,-1991.9513 2107.0955,-1987.1667 2111.5016,-1996.802 2116.5485,-1991.9513"/>
<text text-anchor="middle" x="2141" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- sample&#45;&gt;case -->
<g id="edge36" class="edge">
<title>sample&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M1883.5,-1819.444C1883.5,-1608.4406 1883.5,-1294.7037 1883.5,-1167.7999"/>
<polygon fill="#000000" stroke="#000000" points="1887.0001,-1167.5466 1883.5,-1157.5466 1880.0001,-1167.5466 1887.0001,-1167.5466"/>
<text text-anchor="middle" x="1910.5" y="-1438.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- off_study -->
<g id="node16" class="node">
<title>off_study</title>
<path fill="none" stroke="#000000" d="M1403,-714.5C1403,-714.5 1818,-714.5 1818,-714.5 1824,-714.5 1830,-720.5 1830,-726.5 1830,-726.5 1830,-909.5 1830,-909.5 1830,-915.5 1824,-921.5 1818,-921.5 1818,-921.5 1403,-921.5 1403,-921.5 1397,-921.5 1391,-915.5 1391,-909.5 1391,-909.5 1391,-726.5 1391,-726.5 1391,-720.5 1397,-714.5 1403,-714.5"/>
<text text-anchor="middle" x="1432.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">off_study</text>
<polyline fill="none" stroke="#000000" points="1474,-714.5 1474,-921.5 "/>
<text text-anchor="middle" x="1484.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1495,-714.5 1495,-921.5 "/>
<text text-anchor="middle" x="1652" y="-906.3" font-family="Times,serif" font-size="14.00" fill="#000000">reason_off_study</text>
<polyline fill="none" stroke="#000000" points="1495,-898.5 1809,-898.5 "/>
<text text-anchor="middle" x="1652" y="-883.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_off_treatment</text>
<polyline fill="none" stroke="#000000" points="1495,-875.5 1809,-875.5 "/>
<text text-anchor="middle" x="1652" y="-860.3" font-family="Times,serif" font-size="14.00" fill="#000000">best_resp_vet_tx_tp_best_response</text>
<polyline fill="none" stroke="#000000" points="1495,-852.5 1809,-852.5 "/>
<text text-anchor="middle" x="1652" y="-837.3" font-family="Times,serif" font-size="14.00" fill="#000000">best_resp_vet_tx_tp_secondary_response</text>
<polyline fill="none" stroke="#000000" points="1495,-829.5 1809,-829.5 "/>
<text text-anchor="middle" x="1652" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_last_medication_administration</text>
<polyline fill="none" stroke="#000000" points="1495,-806.5 1809,-806.5 "/>
<text text-anchor="middle" x="1652" y="-791.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_off_study</text>
<polyline fill="none" stroke="#000000" points="1495,-783.5 1809,-783.5 "/>
<text text-anchor="middle" x="1652" y="-768.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_best_response</text>
<polyline fill="none" stroke="#000000" points="1495,-760.5 1809,-760.5 "/>
<text text-anchor="middle" x="1652" y="-745.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_disease_progression</text>
<polyline fill="none" stroke="#000000" points="1495,-737.5 1809,-737.5 "/>
<text text-anchor="middle" x="1652" y="-722.3" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="1809,-714.5 1809,-921.5 "/>
<text text-anchor="middle" x="1819.5" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- physical_exam -->
<g id="node17" class="node">
<title>physical_exam</title>
<path fill="none" stroke="#000000" d="M1313.5,-1934.5C1313.5,-1934.5 1629.5,-1934.5 1629.5,-1934.5 1635.5,-1934.5 1641.5,-1940.5 1641.5,-1946.5 1641.5,-1946.5 1641.5,-2106.5 1641.5,-2106.5 1641.5,-2112.5 1635.5,-2118.5 1629.5,-2118.5 1629.5,-2118.5 1313.5,-2118.5 1313.5,-2118.5 1307.5,-2118.5 1301.5,-2112.5 1301.5,-2106.5 1301.5,-2106.5 1301.5,-1946.5 1301.5,-1946.5 1301.5,-1940.5 1307.5,-1934.5 1313.5,-1934.5"/>
<text text-anchor="middle" x="1362.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">physical_exam</text>
<polyline fill="none" stroke="#000000" points="1423.5,-1934.5 1423.5,-2118.5 "/>
<text text-anchor="middle" x="1434" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="1444.5,-1934.5 1444.5,-2118.5 "/>
<text text-anchor="middle" x="1532.5" y="-2103.3" font-family="Times,serif" font-size="14.00" fill="#000000">day_in_cycle</text>
<polyline fill="none" stroke="#000000" points="1444.5,-2095.5 1620.5,-2095.5 "/>
<text text-anchor="middle" x="1532.5" y="-2080.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="1444.5,-2072.5 1620.5,-2072.5 "/>
<text text-anchor="middle" x="1532.5" y="-2057.3" font-family="Times,serif" font-size="14.00" fill="#000000">body_system</text>
<polyline fill="none" stroke="#000000" points="1444.5,-2049.5 1620.5,-2049.5 "/>
<text text-anchor="middle" x="1532.5" y="-2034.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_examination</text>
<polyline fill="none" stroke="#000000" points="1444.5,-2026.5 1620.5,-2026.5 "/>
<text text-anchor="middle" x="1532.5" y="-2011.3" font-family="Times,serif" font-size="14.00" fill="#000000">pe_finding</text>
<polyline fill="none" stroke="#000000" points="1444.5,-2003.5 1620.5,-2003.5 "/>
<text text-anchor="middle" x="1532.5" y="-1988.3" font-family="Times,serif" font-size="14.00" fill="#000000">phase_pe</text>
<polyline fill="none" stroke="#000000" points="1444.5,-1980.5 1620.5,-1980.5 "/>
<text text-anchor="middle" x="1532.5" y="-1965.3" font-family="Times,serif" font-size="14.00" fill="#000000">assessment_timepoint</text>
<polyline fill="none" stroke="#000000" points="1444.5,-1957.5 1620.5,-1957.5 "/>
<text text-anchor="middle" x="1532.5" y="-1942.3" font-family="Times,serif" font-size="14.00" fill="#000000">pe_comment</text>
<polyline fill="none" stroke="#000000" points="1620.5,-1934.5 1620.5,-2118.5 "/>
<text text-anchor="middle" x="1631" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- physical_exam&#45;&gt;visit -->
<g id="edge14" class="edge">
<title>physical_exam&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M1426.3514,-1934.4121C1393.6913,-1872.4817 1346.0247,-1790.8163 1292.5,-1727 1250.9944,-1677.5138 1193.0111,-1630.3861 1154.4102,-1601.3622"/>
<polygon fill="#000000" stroke="#000000" points="1156.1099,-1598.2638 1146.0002,-1595.0944 1151.9268,-1603.8765 1156.1099,-1598.2638"/>
<text text-anchor="middle" x="1303.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- physical_exam&#45;&gt;enrollment -->
<g id="edge23" class="edge">
<title>physical_exam&#45;&gt;enrollment</title>
<path fill="none" stroke="#000000" d="M1503.8758,-1934.3706C1532.378,-1866.7747 1580.5177,-1778.179 1651.5,-1727 1730.0024,-1670.3989 1972.6596,-1624.9892 2148.9547,-1598.293"/>
<polygon fill="#000000" stroke="#000000" points="2149.5131,-1601.7485 2158.8808,-1596.799 2148.4712,-1594.8265 2149.5131,-1601.7485"/>
<text text-anchor="middle" x="1764.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">at_enrollment</text>
</g>
<!-- enrollment&#45;&gt;case -->
<g id="edge31" class="edge">
<title>enrollment&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M2353.87,-1468.282C2354.485,-1387.3948 2341.4196,-1277.6155 2276.5,-1209 2240.7673,-1171.233 2115.1185,-1144.5585 2015.3927,-1128.7668"/>
<polygon fill="#000000" stroke="#000000" points="2015.6345,-1125.2622 2005.2144,-1127.1783 2014.5551,-1132.1785 2015.6345,-1125.2622"/>
<text text-anchor="middle" x="2378.5" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- agent_administration -->
<g id="node19" class="node">
<title>agent_administration</title>
<path fill="none" stroke="#000000" d="M12,-1785C12,-1785 481,-1785 481,-1785 487,-1785 493,-1791 493,-1797 493,-1797 493,-2256 493,-2256 493,-2262 487,-2268 481,-2268 481,-2268 12,-2268 12,-2268 6,-2268 0,-2262 0,-2256 0,-2256 0,-1797 0,-1797 0,-1791 6,-1785 12,-1785"/>
<text text-anchor="middle" x="85" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">agent_administration</text>
<polyline fill="none" stroke="#000000" points="170,-1785 170,-2268 "/>
<text text-anchor="middle" x="180.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="191,-1785 191,-2268 "/>
<text text-anchor="middle" x="331.5" y="-2252.8" font-family="Times,serif" font-size="14.00" fill="#000000">dose_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="191,-2245 472,-2245 "/>
<text text-anchor="middle" x="331.5" y="-2229.8" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="191,-2222 472,-2222 "/>
<text text-anchor="middle" x="331.5" y="-2206.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication</text>
<polyline fill="none" stroke="#000000" points="191,-2199 472,-2199 "/>
<text text-anchor="middle" x="331.5" y="-2183.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication_lot_number</text>
<polyline fill="none" stroke="#000000" points="191,-2176 472,-2176 "/>
<text text-anchor="middle" x="331.5" y="-2160.8" font-family="Times,serif" font-size="14.00" fill="#000000">missed_dose_amount</text>
<polyline fill="none" stroke="#000000" points="191,-2153 472,-2153 "/>
<text text-anchor="middle" x="331.5" y="-2137.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication_duration</text>
<polyline fill="none" stroke="#000000" points="191,-2130 472,-2130 "/>
<text text-anchor="middle" x="331.5" y="-2114.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication_actual_dose</text>
<polyline fill="none" stroke="#000000" points="191,-2107 472,-2107 "/>
<text text-anchor="middle" x="331.5" y="-2091.8" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="191,-2084 472,-2084 "/>
<text text-anchor="middle" x="331.5" y="-2068.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_missed_dose</text>
<polyline fill="none" stroke="#000000" points="191,-2061 472,-2061 "/>
<text text-anchor="middle" x="331.5" y="-2045.8" font-family="Times,serif" font-size="14.00" fill="#000000">route_of_administration</text>
<polyline fill="none" stroke="#000000" points="191,-2038 472,-2038 "/>
<text text-anchor="middle" x="331.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication_course_number</text>
<polyline fill="none" stroke="#000000" points="191,-2015 472,-2015 "/>
<text text-anchor="middle" x="331.5" y="-1999.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication_vial_id</text>
<polyline fill="none" stroke="#000000" points="191,-1992 472,-1992 "/>
<text text-anchor="middle" x="331.5" y="-1976.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="191,-1969 472,-1969 "/>
<text text-anchor="middle" x="331.5" y="-1953.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication_actual_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="191,-1946 472,-1946 "/>
<text text-anchor="middle" x="331.5" y="-1930.8" font-family="Times,serif" font-size="14.00" fill="#000000">phase</text>
<polyline fill="none" stroke="#000000" points="191,-1923 472,-1923 "/>
<text text-anchor="middle" x="331.5" y="-1907.8" font-family="Times,serif" font-size="14.00" fill="#000000">stop_time</text>
<polyline fill="none" stroke="#000000" points="191,-1900 472,-1900 "/>
<text text-anchor="middle" x="331.5" y="-1884.8" font-family="Times,serif" font-size="14.00" fill="#000000">comment</text>
<polyline fill="none" stroke="#000000" points="191,-1877 472,-1877 "/>
<text text-anchor="middle" x="331.5" y="-1861.8" font-family="Times,serif" font-size="14.00" fill="#000000">dose_level</text>
<polyline fill="none" stroke="#000000" points="191,-1854 472,-1854 "/>
<text text-anchor="middle" x="331.5" y="-1838.8" font-family="Times,serif" font-size="14.00" fill="#000000">missed_dose_units_of_measure</text>
<polyline fill="none" stroke="#000000" points="191,-1831 472,-1831 "/>
<text text-anchor="middle" x="331.5" y="-1815.8" font-family="Times,serif" font-size="14.00" fill="#000000">start_time</text>
<polyline fill="none" stroke="#000000" points="191,-1808 472,-1808 "/>
<text text-anchor="middle" x="331.5" y="-1792.8" font-family="Times,serif" font-size="14.00" fill="#000000">medication_missed_dose</text>
<polyline fill="none" stroke="#000000" points="472,-1785 472,-2268 "/>
<text text-anchor="middle" x="482.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- agent_administration&#45;&gt;visit -->
<g id="edge12" class="edge">
<title>agent_administration&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M436.8028,-1784.9814C457.8605,-1764.186 479.8987,-1744.4571 502.5,-1727 580.3628,-1666.8592 850.2571,-1614.7371 1004.0256,-1589.0372"/>
<polygon fill="#000000" stroke="#000000" points="1004.6918,-1592.4746 1013.9828,-1587.3828 1003.5444,-1585.5693 1004.6918,-1592.4746"/>
<text text-anchor="middle" x="586.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
<!-- agent_administration&#45;&gt;agent -->
<g id="edge25" class="edge">
<title>agent_administration&#45;&gt;agent</title>
<path fill="none" stroke="#000000" d="M282.2722,-1784.9544C289.7919,-1716.2978 295.5,-1641.3439 295.5,-1572 295.5,-1572 295.5,-1572 295.5,-818 295.5,-675.9566 745.7405,-595.7897 978.1543,-563.8699"/>
<polygon fill="#000000" stroke="#000000" points="978.9367,-567.2958 988.373,-562.4783 977.9921,-560.3598 978.9367,-567.2958"/>
<text text-anchor="middle" x="326.5" y="-1179.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_agent</text>
</g>
<!-- principal_investigator -->
<g id="node20" class="node">
<title>principal_investigator</title>
<path fill="none" stroke="#000000" d="M2865,-403.5C2865,-403.5 3192,-403.5 3192,-403.5 3198,-403.5 3204,-409.5 3204,-415.5 3204,-415.5 3204,-460.5 3204,-460.5 3204,-466.5 3198,-472.5 3192,-472.5 3192,-472.5 2865,-472.5 2865,-472.5 2859,-472.5 2853,-466.5 2853,-460.5 2853,-460.5 2853,-415.5 2853,-415.5 2853,-409.5 2859,-403.5 2865,-403.5"/>
<text text-anchor="middle" x="2940" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">principal_investigator</text>
<polyline fill="none" stroke="#000000" points="3027,-403.5 3027,-472.5 "/>
<text text-anchor="middle" x="3037.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="3048,-403.5 3048,-472.5 "/>
<text text-anchor="middle" x="3115.5" y="-457.3" font-family="Times,serif" font-size="14.00" fill="#000000">pi_first_name</text>
<polyline fill="none" stroke="#000000" points="3048,-449.5 3183,-449.5 "/>
<text text-anchor="middle" x="3115.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000">pi_last_name</text>
<polyline fill="none" stroke="#000000" points="3048,-426.5 3183,-426.5 "/>
<text text-anchor="middle" x="3115.5" y="-411.3" font-family="Times,serif" font-size="14.00" fill="#000000">pi_middle_initial</text>
<polyline fill="none" stroke="#000000" points="3183,-403.5 3183,-472.5 "/>
<text text-anchor="middle" x="3193.5" y="-434.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- principal_investigator&#45;&gt;study -->
<g id="edge3" class="edge">
<title>principal_investigator&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M2912.1875,-403.4988C2829.9377,-379.1014 2718.5726,-346.0677 2627.6171,-319.088"/>
<polygon fill="#000000" stroke="#000000" points="2628.3407,-315.652 2617.7583,-316.1636 2626.35,-322.363 2628.3407,-315.652"/>
<text text-anchor="middle" x="2876" y="-373.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_study</text>
</g>
<!-- program -->
<g id="node23" class="node">
<title>program</title>
<path fill="none" stroke="#000000" d="M2311.5,-.5C2311.5,-.5 2619.5,-.5 2619.5,-.5 2625.5,-.5 2631.5,-6.5 2631.5,-12.5 2631.5,-12.5 2631.5,-126.5 2631.5,-126.5 2631.5,-132.5 2625.5,-138.5 2619.5,-138.5 2619.5,-138.5 2311.5,-138.5 2311.5,-138.5 2305.5,-138.5 2299.5,-132.5 2299.5,-126.5 2299.5,-126.5 2299.5,-12.5 2299.5,-12.5 2299.5,-6.5 2305.5,-.5 2311.5,-.5"/>
<text text-anchor="middle" x="2338.5" y="-65.8" font-family="Times,serif" font-size="14.00" fill="#000000">program</text>
<polyline fill="none" stroke="#000000" points="2377.5,-.5 2377.5,-138.5 "/>
<text text-anchor="middle" x="2388" y="-65.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2398.5,-.5 2398.5,-138.5 "/>
<text text-anchor="middle" x="2504.5" y="-123.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_name</text>
<polyline fill="none" stroke="#000000" points="2398.5,-115.5 2610.5,-115.5 "/>
<text text-anchor="middle" x="2504.5" y="-100.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_acronym</text>
<polyline fill="none" stroke="#000000" points="2398.5,-92.5 2610.5,-92.5 "/>
<text text-anchor="middle" x="2504.5" y="-77.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_sort_order</text>
<polyline fill="none" stroke="#000000" points="2398.5,-69.5 2610.5,-69.5 "/>
<text text-anchor="middle" x="2504.5" y="-54.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_full_description</text>
<polyline fill="none" stroke="#000000" points="2398.5,-46.5 2610.5,-46.5 "/>
<text text-anchor="middle" x="2504.5" y="-31.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_external_url</text>
<polyline fill="none" stroke="#000000" points="2398.5,-23.5 2610.5,-23.5 "/>
<text text-anchor="middle" x="2504.5" y="-8.3" font-family="Times,serif" font-size="14.00" fill="#000000">program_short_description</text>
<polyline fill="none" stroke="#000000" points="2610.5,-.5 2610.5,-138.5 "/>
<text text-anchor="middle" x="2621" y="-65.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- study&#45;&gt;program -->
<g id="edge7" class="edge">
<title>study&#45;&gt;program</title>
<path fill="none" stroke="#000000" d="M2465.5,-190.4932C2465.5,-176.7786 2465.5,-162.5421 2465.5,-148.8576"/>
<polygon fill="#000000" stroke="#000000" points="2469.0001,-148.5183 2465.5,-138.5184 2462.0001,-148.5184 2469.0001,-148.5183"/>
<text text-anchor="middle" x="2506" y="-160.8" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- case&#45;&gt;off_treatment -->
<g id="edge11" class="edge">
<title>case&#45;&gt;off_treatment</title>
<path fill="none" stroke="#000000" d="M1933.5373,-1065.3178C1976.4695,-1025.6932 2039.8234,-967.2203 2094.1515,-917.0779"/>
<polygon fill="#000000" stroke="#000000" points="2096.7798,-919.4151 2101.7545,-910.0607 2092.0321,-914.2711 2096.7798,-919.4151"/>
<text text-anchor="middle" x="2039.5" y="-1035.8" font-family="Times,serif" font-size="14.00" fill="#000000">went_off_treatment</text>
</g>
<!-- case&#45;&gt;cohort -->
<g id="edge4" class="edge">
<title>case&#45;&gt;cohort</title>
<path fill="none" stroke="#000000" d="M1875.21,-1065.4138C1861.0757,-977.5965 1837.4301,-780.8749 1876.5,-622 1880.1189,-607.2839 1887.2154,-592.2529 1894.3741,-579.582"/>
<polygon fill="#000000" stroke="#000000" points="1897.4819,-581.2022 1899.549,-570.811 1891.453,-577.6452 1897.4819,-581.2022"/>
<text text-anchor="middle" x="1917" y="-814.3" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- case&#45;&gt;adverse_event -->
<g id="edge27" class="edge">
<title>case&#45;&gt;adverse_event</title>
<path fill="none" stroke="#000000" d="M1761.9557,-1102.7512C1657.6796,-1091.8084 1505.2642,-1067.495 1382.5,-1014 1365.4712,-1006.5796 1348.4774,-997.9322 1331.7783,-988.483"/>
<polygon fill="#000000" stroke="#000000" points="1333.4865,-985.4279 1323.074,-983.4708 1329.9934,-991.4941 1333.4865,-985.4279"/>
<text text-anchor="middle" x="1528.5" y="-1035.8" font-family="Times,serif" font-size="14.00" fill="#000000">had_adverse_event</text>
</g>
<!-- case&#45;&gt;off_study -->
<g id="edge24" class="edge">
<title>case&#45;&gt;off_study</title>
<path fill="none" stroke="#000000" d="M1767.5082,-1065.2815C1758.9557,-1059.7476 1750.8242,-1053.6632 1743.5,-1047 1708.173,-1014.8612 1679.6168,-971.0993 1658.1533,-930.4386"/>
<polygon fill="#000000" stroke="#000000" points="1661.2523,-928.8119 1653.5433,-921.5441 1655.0375,-932.033 1661.2523,-928.8119"/>
<text text-anchor="middle" x="1798" y="-1035.8" font-family="Times,serif" font-size="14.00" fill="#000000">went_off_study</text>
</g>
<!-- case&#45;&gt;study -->
<g id="edge8" class="edge">
<title>case&#45;&gt;study</title>
<path fill="none" stroke="#000000" d="M2005.223,-1107.1834C2152.5699,-1099.2168 2388.2648,-1076.7653 2446.5,-1014 2506.027,-949.8425 2465.5,-905.5195 2465.5,-818 2465.5,-818 2465.5,-818 2465.5,-438 2465.5,-413.2823 2465.5,-386.5067 2465.5,-361.7851"/>
<polygon fill="#000000" stroke="#000000" points="2469.0001,-361.6946 2465.5,-351.6946 2462.0001,-361.6947 2469.0001,-361.6946"/>
<text text-anchor="middle" x="2506" y="-543.8" font-family="Times,serif" font-size="14.00" fill="#000000">member_of</text>
</g>
<!-- assay&#45;&gt;sample -->
<g id="edge28" class="edge">
<title>assay&#45;&gt;sample</title>
<path fill="none" stroke="#000000" d="M1883.5,-2662.3257C1883.5,-2602.0681 1883.5,-2403.6328 1883.5,-2244.2865"/>
<polygon fill="#000000" stroke="#000000" points="1887.0001,-2243.849 1883.5,-2233.849 1880.0001,-2243.8491 1887.0001,-2243.849"/>
<text text-anchor="middle" x="1920" y="-2490.3" font-family="Times,serif" font-size="14.00" fill="#000000">of_sample</text>
</g>
<!-- follow_up -->
<g id="node25" class="node">
<title>follow_up</title>
<path fill="none" stroke="#000000" d="M1923.5,-1209.5C1923.5,-1209.5 2255.5,-1209.5 2255.5,-1209.5 2261.5,-1209.5 2267.5,-1215.5 2267.5,-1221.5 2267.5,-1221.5 2267.5,-1404.5 2267.5,-1404.5 2267.5,-1410.5 2261.5,-1416.5 2255.5,-1416.5 2255.5,-1416.5 1923.5,-1416.5 1923.5,-1416.5 1917.5,-1416.5 1911.5,-1410.5 1911.5,-1404.5 1911.5,-1404.5 1911.5,-1221.5 1911.5,-1221.5 1911.5,-1215.5 1917.5,-1209.5 1923.5,-1209.5"/>
<text text-anchor="middle" x="1954" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000">follow_up</text>
<polyline fill="none" stroke="#000000" points="1996.5,-1209.5 1996.5,-1416.5 "/>
<text text-anchor="middle" x="2007" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2017.5,-1209.5 2017.5,-1416.5 "/>
<text text-anchor="middle" x="2132" y="-1401.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="2017.5,-1393.5 2246.5,-1393.5 "/>
<text text-anchor="middle" x="2132" y="-1378.3" font-family="Times,serif" font-size="14.00" fill="#000000">explain_unknown_status</text>
<polyline fill="none" stroke="#000000" points="2017.5,-1370.5 2246.5,-1370.5 "/>
<text text-anchor="middle" x="2132" y="-1355.3" font-family="Times,serif" font-size="14.00" fill="#000000">document_number</text>
<polyline fill="none" stroke="#000000" points="2017.5,-1347.5 2246.5,-1347.5 "/>
<text text-anchor="middle" x="2132" y="-1332.3" font-family="Times,serif" font-size="14.00" fill="#000000">treatment_since_last_contact</text>
<polyline fill="none" stroke="#000000" points="2017.5,-1324.5 2246.5,-1324.5 "/>
<text text-anchor="middle" x="2132" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000">patient_status</text>
<polyline fill="none" stroke="#000000" points="2017.5,-1301.5 2246.5,-1301.5 "/>
<text text-anchor="middle" x="2132" y="-1286.3" font-family="Times,serif" font-size="14.00" fill="#000000">contact_type</text>
<polyline fill="none" stroke="#000000" points="2017.5,-1278.5 2246.5,-1278.5 "/>
<text text-anchor="middle" x="2132" y="-1263.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_last_contact</text>
<polyline fill="none" stroke="#000000" points="2017.5,-1255.5 2246.5,-1255.5 "/>
<text text-anchor="middle" x="2132" y="-1240.3" font-family="Times,serif" font-size="14.00" fill="#000000">physical_exam_changes</text>
<polyline fill="none" stroke="#000000" points="2017.5,-1232.5 2246.5,-1232.5 "/>
<text text-anchor="middle" x="2132" y="-1217.3" font-family="Times,serif" font-size="14.00" fill="#000000">physical_exam_performed</text>
<polyline fill="none" stroke="#000000" points="2246.5,-1209.5 2246.5,-1416.5 "/>
<text text-anchor="middle" x="2257" y="-1309.3" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- follow_up&#45;&gt;case -->
<g id="edge35" class="edge">
<title>follow_up&#45;&gt;case</title>
<path fill="none" stroke="#000000" d="M1983.4828,-1209.2987C1967.7002,-1193.8608 1952.0121,-1178.5154 1937.9025,-1164.7141"/>
<polygon fill="#000000" stroke="#000000" points="1940.2719,-1162.1358 1930.6758,-1157.6452 1935.3771,-1167.1399 1940.2719,-1162.1358"/>
<text text-anchor="middle" x="1988.5" y="-1179.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_case</text>
</g>
<!-- agent&#45;&gt;study_arm -->
<g id="edge30" class="edge">
<title>agent&#45;&gt;study_arm</title>
<path fill="none" stroke="#000000" d="M1238.8125,-530.3906C1372.4237,-512.1482 1585.179,-483.0999 1736.4362,-462.4482"/>
<polygon fill="#000000" stroke="#000000" points="1737.3288,-465.8589 1746.7634,-461.0382 1736.3818,-458.9233 1737.3288,-465.8589"/>
<text text-anchor="middle" x="1563" y="-494.8" font-family="Times,serif" font-size="14.00" fill="#000000">of_study_arm</text>
</g>
<!-- prior_surgery -->
<g id="node27" class="node">
<title>prior_surgery</title>
<path fill="none" stroke="#000000" d="M2187.5,-1946C2187.5,-1946 2533.5,-1946 2533.5,-1946 2539.5,-1946 2545.5,-1952 2545.5,-1958 2545.5,-1958 2545.5,-2095 2545.5,-2095 2545.5,-2101 2539.5,-2107 2533.5,-2107 2533.5,-2107 2187.5,-2107 2187.5,-2107 2181.5,-2107 2175.5,-2101 2175.5,-2095 2175.5,-2095 2175.5,-1958 2175.5,-1958 2175.5,-1952 2181.5,-1946 2187.5,-1946"/>
<text text-anchor="middle" x="2233" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">prior_surgery</text>
<polyline fill="none" stroke="#000000" points="2290.5,-1946 2290.5,-2107 "/>
<text text-anchor="middle" x="2301" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="2311.5,-1946 2311.5,-2107 "/>
<text text-anchor="middle" x="2418" y="-2091.8" font-family="Times,serif" font-size="14.00" fill="#000000">anatomical_site_of_surgery</text>
<polyline fill="none" stroke="#000000" points="2311.5,-2084 2524.5,-2084 "/>
<text text-anchor="middle" x="2418" y="-2068.8" font-family="Times,serif" font-size="14.00" fill="#000000">therapeutic_indicator</text>
<polyline fill="none" stroke="#000000" points="2311.5,-2061 2524.5,-2061 "/>
<text text-anchor="middle" x="2418" y="-2045.8" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="2311.5,-2038 2524.5,-2038 "/>
<text text-anchor="middle" x="2418" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_surgery</text>
<polyline fill="none" stroke="#000000" points="2311.5,-2015 2524.5,-2015 "/>
<text text-anchor="middle" x="2418" y="-1999.8" font-family="Times,serif" font-size="14.00" fill="#000000">surgical_finding</text>
<polyline fill="none" stroke="#000000" points="2311.5,-1992 2524.5,-1992 "/>
<text text-anchor="middle" x="2418" y="-1976.8" font-family="Times,serif" font-size="14.00" fill="#000000">residual_disease</text>
<polyline fill="none" stroke="#000000" points="2311.5,-1969 2524.5,-1969 "/>
<text text-anchor="middle" x="2418" y="-1953.8" font-family="Times,serif" font-size="14.00" fill="#000000">procedure</text>
<polyline fill="none" stroke="#000000" points="2524.5,-1946 2524.5,-2107 "/>
<text text-anchor="middle" x="2535" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- prior_surgery&#45;&gt;enrollment -->
<g id="edge22" class="edge">
<title>prior_surgery&#45;&gt;enrollment</title>
<path fill="none" stroke="#000000" d="M2357.8356,-1945.7682C2355.4499,-1873.4814 2351.9262,-1766.714 2349.2551,-1685.7784"/>
<polygon fill="#000000" stroke="#000000" points="2352.7452,-1685.4191 2348.9172,-1675.5401 2345.749,-1685.6501 2352.7452,-1685.4191"/>
<text text-anchor="middle" x="2399.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">at_enrollment</text>
</g>
<!-- prior_surgery&#45;&gt;prior_surgery -->
<g id="edge40" class="edge">
<title>prior_surgery&#45;&gt;prior_surgery</title>
<path fill="none" stroke="#000000" d="M2545.613,-2068.5585C2556.7907,-2058.5547 2563.5,-2044.5352 2563.5,-2026.5 2563.5,-2012.5509 2559.4865,-2001.004 2552.4962,-1991.8593"/>
<polygon fill="#000000" stroke="#000000" points="2554.9806,-1989.3911 2545.613,-1984.4415 2549.8494,-1994.1525 2554.9806,-1989.3911"/>
<text text-anchor="middle" x="2579.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">next</text>
</g>
<!-- vital_signs -->
<g id="node28" class="node">
<title>vital_signs</title>
<path fill="none" stroke="#000000" d="M626,-1865.5C626,-1865.5 913,-1865.5 913,-1865.5 919,-1865.5 925,-1871.5 925,-1877.5 925,-1877.5 925,-2175.5 925,-2175.5 925,-2181.5 919,-2187.5 913,-2187.5 913,-2187.5 626,-2187.5 626,-2187.5 620,-2187.5 614,-2181.5 614,-2175.5 614,-2175.5 614,-1877.5 614,-1877.5 614,-1871.5 620,-1865.5 626,-1865.5"/>
<text text-anchor="middle" x="660.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000">vital_signs</text>
<polyline fill="none" stroke="#000000" points="707,-1865.5 707,-2187.5 "/>
<text text-anchor="middle" x="717.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
<polyline fill="none" stroke="#000000" points="728,-1865.5 728,-2187.5 "/>
<text text-anchor="middle" x="816" y="-2172.3" font-family="Times,serif" font-size="14.00" fill="#000000">ecg</text>
<polyline fill="none" stroke="#000000" points="728,-2164.5 904,-2164.5 "/>
<text text-anchor="middle" x="816" y="-2149.3" font-family="Times,serif" font-size="14.00" fill="#000000">assessment_timepoint</text>
<polyline fill="none" stroke="#000000" points="728,-2141.5 904,-2141.5 "/>
<text text-anchor="middle" x="816" y="-2126.3" font-family="Times,serif" font-size="14.00" fill="#000000">respiration_pattern</text>
<polyline fill="none" stroke="#000000" points="728,-2118.5 904,-2118.5 "/>
<text text-anchor="middle" x="816" y="-2103.3" font-family="Times,serif" font-size="14.00" fill="#000000">phase</text>
<polyline fill="none" stroke="#000000" points="728,-2095.5 904,-2095.5 "/>
<text text-anchor="middle" x="816" y="-2080.3" font-family="Times,serif" font-size="14.00" fill="#000000">respiration_rate</text>
<polyline fill="none" stroke="#000000" points="728,-2072.5 904,-2072.5 "/>
<text text-anchor="middle" x="816" y="-2057.3" font-family="Times,serif" font-size="14.00" fill="#000000">body_surface_area</text>
<polyline fill="none" stroke="#000000" points="728,-2049.5 904,-2049.5 "/>
<text text-anchor="middle" x="816" y="-2034.3" font-family="Times,serif" font-size="14.00" fill="#000000">modified_ecog</text>
<polyline fill="none" stroke="#000000" points="728,-2026.5 904,-2026.5 "/>
<text text-anchor="middle" x="816" y="-2011.3" font-family="Times,serif" font-size="14.00" fill="#000000">body_temperature</text>
<polyline fill="none" stroke="#000000" points="728,-2003.5 904,-2003.5 "/>
<text text-anchor="middle" x="816" y="-1988.3" font-family="Times,serif" font-size="14.00" fill="#000000">crf_id</text>
<polyline fill="none" stroke="#000000" points="728,-1980.5 904,-1980.5 "/>
<text text-anchor="middle" x="816" y="-1965.3" font-family="Times,serif" font-size="14.00" fill="#000000">pulse</text>
<polyline fill="none" stroke="#000000" points="728,-1957.5 904,-1957.5 "/>
<text text-anchor="middle" x="816" y="-1942.3" font-family="Times,serif" font-size="14.00" fill="#000000">date_of_vital_signs</text>
<polyline fill="none" stroke="#000000" points="728,-1934.5 904,-1934.5 "/>
<text text-anchor="middle" x="816" y="-1919.3" font-family="Times,serif" font-size="14.00" fill="#000000">systolic_bp</text>
<polyline fill="none" stroke="#000000" points="728,-1911.5 904,-1911.5 "/>
<text text-anchor="middle" x="816" y="-1896.3" font-family="Times,serif" font-size="14.00" fill="#000000">pulse_ox</text>
<polyline fill="none" stroke="#000000" points="728,-1888.5 904,-1888.5 "/>
<text text-anchor="middle" x="816" y="-1873.3" font-family="Times,serif" font-size="14.00" fill="#000000">patient_weight</text>
<polyline fill="none" stroke="#000000" points="904,-1865.5 904,-2187.5 "/>
<text text-anchor="middle" x="914.5" y="-2022.8" font-family="Times,serif" font-size="14.00" fill="#000000"> </text>
</g>
<!-- vital_signs&#45;&gt;visit -->
<g id="edge18" class="edge">
<title>vital_signs&#45;&gt;visit</title>
<path fill="none" stroke="#000000" d="M844.8428,-1865.1895C870.1817,-1818.429 900.7036,-1768.764 934.5,-1727 975.0092,-1676.9406 1032.968,-1630.1064 1071.852,-1601.2951"/>
<polygon fill="#000000" stroke="#000000" points="1074.3391,-1603.8113 1080.3313,-1595.0737 1070.1982,-1598.1675 1074.3391,-1603.8113"/>
<text text-anchor="middle" x="987.5" y="-1697.8" font-family="Times,serif" font-size="14.00" fill="#000000">on_visit</text>
</g>
</g>
</svg>
</div>
