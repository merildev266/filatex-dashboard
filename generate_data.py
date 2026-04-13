"""
Legacy entry point — kept for backwards compatibility.

Real work is now done by generate_hfo_data.py, which uses the Global +
Previsionnel pipeline in addition to the per-site monthly xlsx reader.
"""
from generate_hfo_data import generate


if __name__ == "__main__":
    generate()
