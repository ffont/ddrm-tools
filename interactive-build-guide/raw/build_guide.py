import os
import shutil
from collections import defaultdict

outdir = 'out'
index = defaultdict(list)

import re
exp = re.compile(r'[0-9]x[0-9]')

for filename in os.listdir('.'):
	if filename.endswith('.jpg') and not exp.search(filename):
		board, number, name = [elm for elm in filename.split('_') if elm][0:3]
		number = int(number)
		index[board].append((number, name, filename))

for board, pics in index.items():
	
	pics = sorted(pics, key=lambda x: x[0])
	
	for number, name, filename in pics:
		shutil.copy(filename, 'out/%s' % filename)

		

