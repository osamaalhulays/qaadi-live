# Determinism

The `determinism_matrix.json` file reports how reproducible a theory build is
across different snapshot timestamps. Determinism is calculated **per
slug-version pair**. Only manifest entries whose `slug` and `v` match the
requested archive are used when constructing the matrix.

